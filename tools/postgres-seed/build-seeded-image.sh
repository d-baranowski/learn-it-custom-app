#!/usr/bin/env bash
# Build (or cache-hit) ghcr.io/inspiration-particle/utro-postgres-seeded:<SCHEMA_HASH>.
#
# SCHEMA_HASH is sha256 of all inputs that determine the seeded image's contents:
# core migrations, payment migrations, bootstrap seed SQL files, the postgres
# Dockerfile, and the source-image tag (which encapsulates migrate/bootstrap
# binary versions). If any input changes, the hash changes and we rebuild.
#
# Expects in environment:
#   IMAGE_TAG         e.g. UTR-000122 or main — used to tag the source binaries
#   IMAGE_TAG_SHA     e.g. UTR-000122-abc1234 — preferred over IMAGE_TAG (pinned to commit)
#   GHCR_USER         set by withCredentials in Jenkinsfile
#   GHCR_TOKEN        set by withCredentials in Jenkinsfile
#
# Writes to $GITHUB_OUTPUT-style file at $SEEDED_TAG_FILE (one line: the hash).
# Caller reads that and sets env.SEEDED_POSTGRES_TAG.

set -euo pipefail

# ── Configuration ───────────────────────────────────────────────────────────
REGISTRY="${IMAGE_REGISTRY:-ghcr.io/inspiration-particle}"
IMAGE_NAME="utro-postgres-seeded"
SOURCE_TAG="${IMAGE_TAG_SHA:-${IMAGE_TAG:-main}}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT_DIR="$REPO_ROOT/tools/postgres-seed"
SEED_COMPOSE="$SCRIPT_DIR/docker-compose.seed-build.yml"
SEEDED_TAG_FILE="${SEEDED_TAG_FILE:-$SCRIPT_DIR/.seeded-tag}"

# ── Compute SCHEMA_HASH ─────────────────────────────────────────────────────
# Hash inputs whose change should invalidate the seeded image. Order-stable
# via `sort` so the same content always yields the same digest.
HASH_INPUTS=$(
  {
    find "$REPO_ROOT/app/core/db" -type f -name '*.sql' -print0
    find "$REPO_ROOT/app/payment/db" -type f -name '*.sql' -print0
    find "$REPO_ROOT/app/notification/db" -type f -name '*.sql' -print0
    find "$REPO_ROOT/app/core-event/db" -type f -name '*.sql' -print0
    find "$REPO_ROOT/app/bootstrap/service/bootstrap" -type f -name '*.sql' -print0
    find "$REPO_ROOT/docker/postgres" -type f -print0
    printf '%s\0' "$SCRIPT_DIR/docker-compose.seed-build.yml"
    printf '%s\0' "$0"
  } | xargs -0 sha256sum | sort | sha256sum | awk '{print $1}'
)
# Pin the binary versions into the hash too — different IMAGE_TAG_SHA means
# different migrate/bootstrap binary, so the seeded data must rebuild.
SCHEMA_HASH=$(printf '%s\n%s' "$HASH_INPUTS" "$SOURCE_TAG" | sha256sum | awk '{print $1}' | cut -c1-16)
echo "[seed] SCHEMA_HASH=$SCHEMA_HASH (sources@$SOURCE_TAG)"

SEEDED_TAG="$REGISTRY/$IMAGE_NAME:$SCHEMA_HASH"
echo "[seed] target tag: $SEEDED_TAG"

# Record the hash for the caller so it can plumb SEEDED_POSTGRES_IMAGE forward.
echo "$SCHEMA_HASH" > "$SEEDED_TAG_FILE"

# ── GHCR auth (mirrors buildAndPushContainer in Jenkinsfile) ────────────────
if [[ -n "${GHCR_USER:-}" && -n "${GHCR_TOKEN:-}" ]]; then
  export DOCKER_CONFIG="$(mktemp -d)"
  trap 'rm -rf "$DOCKER_CONFIG"' EXIT
  AUTH=$(printf '%s:%s' "$GHCR_USER" "$GHCR_TOKEN" | base64 | tr -d '\n')
  printf '{"auths":{"ghcr.io":{"auth":"%s"}}}\n' "$AUTH" > "$DOCKER_CONFIG/config.json"
fi

# ── Cache hit? ──────────────────────────────────────────────────────────────
if timeout 10 docker manifest inspect "$SEEDED_TAG" >/dev/null 2>&1; then
  echo "[seed] cache hit — $SEEDED_TAG already in GHCR, skipping build."
  exit 0
fi
echo "[seed] cache miss — building."

# ── Build ───────────────────────────────────────────────────────────────────
PROJECT="postgres-seed-${SCHEMA_HASH}-$$"
export UTRO_CORE_IMAGE="$REGISTRY/utro-core:$SOURCE_TAG"
export UTRO_PAYMENT_IMAGE="$REGISTRY/utro-payment:$SOURCE_TAG"
export UTRO_BOOTSTRAP_IMAGE="$REGISTRY/utro-bootstrap:$SOURCE_TAG"
export UTRO_NOTIFICATION_IMAGE="$REGISTRY/utro-notification:$SOURCE_TAG"
export UTRO_CORE_EVENT_IMAGE="$REGISTRY/utro-core-event:$SOURCE_TAG"

cleanup_compose() {
  docker compose -p "$PROJECT" -f "$SEED_COMPOSE" down --remove-orphans 2>/dev/null || true
}
trap 'cleanup_compose; rm -rf "${DOCKER_CONFIG:-/nonexistent}"' EXIT

# Pull the binary images up-front so failures surface cleanly.
docker compose -p "$PROJECT" -f "$SEED_COMPOSE" pull --quiet migrate payment-migrate notification-migrate core-event-migrate bootstrap

# Start postgres first and block until the healthcheck passes. In detached
# mode, `up -d` creates containers immediately and depends_on conditions
# fire on the scheduler's tick — but there's a race where pg_isready
# returns 0 before the initdb.d scripts finish creating the `rpg` database.
# Using `--wait` here blocks until postgres is genuinely healthy.
docker compose -p "$PROJECT" -f "$SEED_COMPOSE" up -d --wait postgres

echo "[seed] postgres healthy, starting migrate + payment-migrate..."
docker compose -p "$PROJECT" -f "$SEED_COMPOSE" up -d \
  migrate payment-migrate

echo "[seed] waiting for migrate + payment-migrate to complete..."
docker compose -p "$PROJECT" -f "$SEED_COMPOSE" wait migrate payment-migrate

echo "[seed] starting notification-migrate + core-event-migrate..."
docker compose -p "$PROJECT" -f "$SEED_COMPOSE" up -d notification-migrate core-event-migrate
docker compose -p "$PROJECT" -f "$SEED_COMPOSE" wait notification-migrate core-event-migrate

echo "[seed] starting bootstrap..."
docker compose -p "$PROJECT" -f "$SEED_COMPOSE" up -d bootstrap
docker compose -p "$PROJECT" -f "$SEED_COMPOSE" wait bootstrap

# Surface migrate/bootstrap exit codes — any non-zero is fatal.
for svc in migrate payment-migrate notification-migrate core-event-migrate bootstrap; do
  CID=$(docker compose -p "$PROJECT" -f "$SEED_COMPOSE" ps -a -q "$svc")
  if [[ -z "$CID" ]]; then
    echo "[seed] FATAL: $svc container not found" >&2
    docker compose -p "$PROJECT" -f "$SEED_COMPOSE" logs "$svc" || true
    exit 1
  fi
  EXIT_CODE=$(docker inspect -f '{{.State.ExitCode}}' "$CID")
  if [[ "$EXIT_CODE" -ne 0 ]]; then
    echo "[seed] FATAL: $svc exited with code $EXIT_CODE" >&2
    docker compose -p "$PROJECT" -f "$SEED_COMPOSE" logs "$svc" || true
    exit 1
  fi
  echo "[seed] ✓ $svc exited 0"
done

POSTGRES_CID=$(docker compose -p "$PROJECT" -f "$SEED_COMPOSE" ps -a -q postgres)
if [[ -z "$POSTGRES_CID" ]]; then
  echo "[seed] FATAL: could not find postgres container after seed run" >&2
  exit 1
fi
echo "[seed] postgres container: $POSTGRES_CID"

# Verify the data dir actually has content (sanity check before committing).
# Done BEFORE stopping postgres so we can `docker exec` into the running
# container. /var/lib/postgresql/seeded is NOT a declared docker VOLUME —
# it's a regular directory in the postgres container's filesystem — so
# `--volumes-from` from a sidecar container cannot see it (that's how PR-122
# build #16 produced "/var/lib/postgresql/seeded is  bytes" — empty value).
# pg_cron + 38 core migrations + bootstrap should produce well over 50MB.
# Path is /seeded (not the default /data) — see seed-build compose for why.
DATA_BYTES=$(docker exec "$POSTGRES_CID" du -sb /var/lib/postgresql/seeded | cut -f1)
echo "[seed] /var/lib/postgresql/seeded is $DATA_BYTES bytes"
if [[ -z "$DATA_BYTES" || "$DATA_BYTES" -lt 10000000 ]]; then
  echo "[seed] FATAL: data dir suspiciously small (<10MB). Bootstrap may have failed silently." >&2
  docker compose -p "$PROJECT" -f "$SEED_COMPOSE" logs postgres bootstrap migrate payment-migrate notification-migrate >&2 || true
  exit 1
fi

# Stop postgres cleanly so its WAL is flushed before we snapshot the data dir.
docker compose -p "$PROJECT" -f "$SEED_COMPOSE" stop -t 30 postgres

# ── Commit + tag + push ─────────────────────────────────────────────────────
# Bake PGDATA env into the seeded image so postgres reads from /seeded
# regardless of what the consuming compose file does with the default
# /var/lib/postgresql/data path (where the base compose's named volume
# still gets mounted — harmlessly, since postgres ignores it now).
# CMD is also reset to match tools/e2e-test/docker-compose.yml:17-25 so
# the seeded image is a drop-in replacement.
docker commit \
  --change 'ENV PGDATA=/var/lib/postgresql/seeded' \
  --change 'CMD ["postgres","-c","log_destination=stderr","-c","shared_preload_libraries=pg_cron","-c","wal_level=logical","-c","max_wal_senders=10","-c","max_replication_slots=10","-c","cron.database_name=rpg"]' \
  "$POSTGRES_CID" \
  "$SEEDED_TAG"

echo "[seed] committed → $SEEDED_TAG"

# Also publish under the human-readable IMAGE_TAG / IMAGE_TAG_SHA for
# observability — matches how other utro images are tagged.
docker tag "$SEEDED_TAG" "$REGISTRY/$IMAGE_NAME:$SOURCE_TAG"
docker tag "$SEEDED_TAG" "$REGISTRY/$IMAGE_NAME:${IMAGE_TAG:-main}"

docker push "$SEEDED_TAG"
docker push "$REGISTRY/$IMAGE_NAME:$SOURCE_TAG"
docker push "$REGISTRY/$IMAGE_NAME:${IMAGE_TAG:-main}"

echo "[seed] done."
