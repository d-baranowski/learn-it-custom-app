#!/usr/bin/env bash
#
# run-e2e-parallel.sh — Run Cypress E2E tests across N parallel workers,
# each backed by a fully containerized stack (Docker only, no Go/Next.js on host).
#
# Each worker gets its own Docker network with:
#   - Postgres container (with pg_cron + pg_partman)
#   - Core, Gateway, Payment, Bootstrap, UI containers
#
# Usage:
#   ./run-e2e-parallel.sh [NUM_WORKERS]   # default: 2
#
# Port scheme per worker N (0-indexed):
#   UI:             4000 + N
#   Bootstrap API:  8080 + N * 100

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NUM_WORKERS="${1:-2}"
REPO_ROOT="$SCRIPT_DIR"
GIT_SHORT_HASH=$(git -C "$REPO_ROOT" rev-parse HEAD | cut -c1-7)
TOTAL_START=$(date +%s)

# Results directory — gitignored. ALL e2e artifacts (per-worker logs,
# screenshots, mochawesome JSON, the merged HTML report, and this script's
# top-level run log) live under here so the repo root stays clean.
RESULTS_DIR="$REPO_ROOT/e2e-parallel-results"
mkdir -p "$RESULTS_DIR"

# Top-level run log: tee everything from this script into a timestamped file.
# Skip if already running under a tee/redirect (RUN_LOG already set by caller).
if [[ -z "${RUN_LOG:-}" ]]; then
  RUN_LOG="$RESULTS_DIR/run-$(date +%Y%m%d-%H%M%S)-${NUM_WORKERS}w-${GIT_SHORT_HASH}.log"
  export RUN_LOG
  # Re-exec self with output piped through tee. PIPESTATUS preserves exit code.
  exec > >(tee "$RUN_LOG") 2>&1
fi

# Docker image names
IMG_POSTGRES="utro-e2e-postgres:${GIT_SHORT_HASH}"
NX_IMG_TAG="sha-${GIT_SHORT_HASH}"
IMG_CORE="inspirationparticleltd/utro-core:${NX_IMG_TAG}"
IMG_GATEWAY="inspirationparticleltd/utro-gateway:${NX_IMG_TAG}"
IMG_BOOTSTRAP="inspirationparticleltd/utro-bootstrap:${NX_IMG_TAG}"
IMG_PAYMENT="inspirationparticleltd/utro-payment:${NX_IMG_TAG}"
IMG_UI="inspirationparticleltd/utro-ui:${NX_IMG_TAG}"

# Postgres credentials
PG_USER="postgres"
PG_PASS="password"
PG_DB="rpg"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()        { echo -e "${CYAN}[parallel-e2e]${NC} $*"; }
log_worker() { echo -e "${YELLOW}[worker-$1]${NC} ${*:2}"; }
log_ok()     { echo -e "${GREEN}[parallel-e2e]${NC} $*"; }
log_err()    { echo -e "${RED}[parallel-e2e]${NC} $*" >&2; }
log_phase()  { echo -e "\n${BOLD}${CYAN}=== $* ===${NC}\n"; }

fmt_duration() {
  local secs=$1
  if (( secs >= 3600 )); then printf '%dh %dm %ds' $((secs/3600)) $((secs%3600/60)) $((secs%60))
  elif (( secs >= 60 )); then printf '%dm %ds' $((secs/60)) $((secs%60))
  else printf '%ds' "$secs"; fi
}

# --------------------------------------------------------------------------
# Cleanup
# --------------------------------------------------------------------------
cleanup() {
  log "Cleaning up..."
  for (( i=0; i<NUM_WORKERS; i++ )); do
    local prefix="e2e-w${i}" network="${prefix}-net"
    for container in $(docker ps -a --filter "network=${network}" --format '{{.Names}}' 2>/dev/null); do
      docker rm -f "$container" 2>/dev/null || true
    done
    docker network rm "$network" 2>/dev/null || true
  done
  jobs -p 2>/dev/null | xargs kill 2>/dev/null || true
  log "Cleanup complete."
}
trap cleanup EXIT INT TERM

# --------------------------------------------------------------------------
# Phase 0: Pre-cleanup
# --------------------------------------------------------------------------
log_phase "Phase 0: Pre-cleanup"
for (( i=0; i<50; i++ )); do
  prefix="e2e-w${i}"; network="${prefix}-net"
  for container in $(docker ps -a --filter "network=${network}" --format '{{.Names}}' 2>/dev/null); do
    docker rm -f "$container" 2>/dev/null || true
  done
  docker network rm "$network" 2>/dev/null || true
done

# --------------------------------------------------------------------------
# Phase 1: Distribute specs
# --------------------------------------------------------------------------
log_phase "Phase 1: Distribute specs"

ALL_SPECS=()
while IFS= read -r line; do ALL_SPECS+=("$line"); done < <(find "$REPO_ROOT/tools/e2e-test/cypress/e2e" -name '*.cy.ts' | sort)
TOTAL_SPECS=${#ALL_SPECS[@]}

if (( TOTAL_SPECS == 0 )); then log_err "No spec files found!"; exit 1; fi

log "Found $TOTAL_SPECS spec files, distributing across $NUM_WORKERS workers"

declare -a WORKER_SPECS
for (( i=0; i<NUM_WORKERS; i++ )); do WORKER_SPECS[$i]=""; done

for (( s=0; s<TOTAL_SPECS; s++ )); do
  worker=$(( s % NUM_WORKERS ))
  if [[ -n "${WORKER_SPECS[$worker]}" ]]; then
    WORKER_SPECS[$worker]="${WORKER_SPECS[$worker]},${ALL_SPECS[$s]}"
  else
    WORKER_SPECS[$worker]="${ALL_SPECS[$s]}"
  fi
done

for (( i=0; i<NUM_WORKERS; i++ )); do
  count=$(echo "${WORKER_SPECS[$i]}" | tr ',' '\n' | wc -l | tr -d ' ')
  log_worker "$i" "assigned $count specs"
done

# --------------------------------------------------------------------------
# Phase 2: Build Docker images
# --------------------------------------------------------------------------
PHASE2_START=$(date +%s)
log_phase "Phase 2: Build Docker images (tag: ${NX_IMG_TAG})"

if docker image inspect "$IMG_POSTGRES" >/dev/null 2>&1; then
  log "  $IMG_POSTGRES — already exists, skipping"
else
  log "  $IMG_POSTGRES — building..."
  docker build -t "$IMG_POSTGRES" -f "$REPO_ROOT/docker/postgres/Dockerfile" "$REPO_ROOT/docker/postgres"
  log_ok "  $IMG_POSTGRES — built"
fi

NX_BUILD_NEEDED=false
for img in "$IMG_CORE" "$IMG_GATEWAY" "$IMG_BOOTSTRAP" "$IMG_PAYMENT" "$IMG_UI"; do
  if ! docker image inspect "$img" >/dev/null 2>&1; then
    log "  $img — not found, will build via Nx"
    NX_BUILD_NEEDED=true
  else
    log "  $img — already exists"
  fi
done

if $NX_BUILD_NEEDED; then
  log "Building service images via Nx (container:local)..."
  pnpm exec nx run-many -t container -c local --projects=core,gateway,bootstrap,payment,ui --skip-nx-cache
  log_ok "Nx container builds complete"
else
  log_ok "All service images already exist, skipping Nx build"
fi

PHASE2_DURATION=$(( $(date +%s) - PHASE2_START ))
log_ok "All images ready ($(fmt_duration $PHASE2_DURATION))"

# --------------------------------------------------------------------------
# Phase 3: Start Postgres containers
# --------------------------------------------------------------------------
PHASE3_START=$(date +%s)
log_phase "Phase 3: Start Postgres containers"

for (( i=0; i<NUM_WORKERS; i++ )); do
  prefix="e2e-w${i}"; network="${prefix}-net"
  docker network create "$network" 2>/dev/null || true
  log_worker "$i" "starting postgres on network $network"
  docker run -d --name "${prefix}-postgres" --network "$network" --network-alias postgres \
    --shm-size=256m -e POSTGRES_USER="$PG_USER" -e POSTGRES_PASSWORD="$PG_PASS" \
    -v "$REPO_ROOT/docker/postgres/initdb.d:/docker-entrypoint-initdb.d:ro" \
    "$IMG_POSTGRES" postgres \
      -c "log_destination=stderr" -c "shared_preload_libraries=pg_cron" \
      -c "wal_level=logical" -c "max_wal_senders=10" -c "max_replication_slots=10" \
      -c "cron.database_name=rpg" > /dev/null
done

log "Waiting for Postgres containers..."
wait_for_pg_container() {
  local container="$1" timeout="${2:-60}" elapsed=0
  while ! docker exec "$container" pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1; do
    sleep 2; elapsed=$((elapsed + 2))
    if (( elapsed >= timeout )); then log_err "$container not ready within ${timeout}s"; return 1; fi
  done
  log_ok "$container ready (${elapsed}s)"
}
PG_PIDS=()
for (( i=0; i<NUM_WORKERS; i++ )); do wait_for_pg_container "e2e-w${i}-postgres" 60 & PG_PIDS+=($!); done
PG_FAIL=0
for pid in "${PG_PIDS[@]}"; do if ! wait "$pid"; then PG_FAIL=1; fi; done
if (( PG_FAIL )); then log_err "Postgres startup failed. Aborting."; exit 1; fi
PHASE3_DURATION=$(( $(date +%s) - PHASE3_START ))
log_ok "Postgres ready ($(fmt_duration $PHASE3_DURATION))"

# --------------------------------------------------------------------------
# Phase 4: Run migrations
# --------------------------------------------------------------------------
PHASE4_START=$(date +%s)
log_phase "Phase 4: Run migrations"
MIGRATE_PIDS=()
for (( i=0; i<NUM_WORKERS; i++ )); do
  prefix="e2e-w${i}"
  (
    log_worker "$i" "running core migrations..."
    docker run --rm --name "${prefix}-migrate" --network "${prefix}-net" \
      -e MIGRATE=true -e DB_USER="$PG_USER" -e DB_PASS="$PG_PASS" \
      -e DB_HOST=postgres -e DB_PORT=5432 -e DB_NAME="$PG_DB" \
      -e LOG_LEVEL=warn -e TIMEZONE=Europe/Warsaw \
      "$IMG_CORE" 2>&1 | sed "s/^/[w${i}-migrate] /"
    log_worker "$i" "migrations complete"
  ) &
  MIGRATE_PIDS+=($!)
done
MIGRATE_FAIL=0
for pid in "${MIGRATE_PIDS[@]}"; do if ! wait "$pid"; then MIGRATE_FAIL=1; fi; done
if (( MIGRATE_FAIL )); then log_err "Migration failed. Aborting."; exit 1; fi
PHASE4_DURATION=$(( $(date +%s) - PHASE4_START ))
log_ok "Migrations complete ($(fmt_duration $PHASE4_DURATION))"

# --------------------------------------------------------------------------
# Phase 5: Run bootstrap (seed data)
# --------------------------------------------------------------------------
PHASE5_START=$(date +%s)
log_phase "Phase 5: Run bootstrap (seed data)"
BOOT_PIDS=()
for (( i=0; i<NUM_WORKERS; i++ )); do
  prefix="e2e-w${i}"
  (
    log_worker "$i" "running bootstrap seed..."
    docker run --rm --name "${prefix}-bootstrap-seed" --network "${prefix}-net" \
      -e DB_USER="$PG_USER" -e DB_PASS="$PG_PASS" \
      -e DB_HOST=postgres -e DB_PORT=5432 -e DB_NAME="$PG_DB" \
      -e LOG_LEVEL=warn -e TIMEZONE=Europe/Warsaw \
      "$IMG_BOOTSTRAP" 2>&1 | sed "s/^/[w${i}-bootstrap] /"
    log_worker "$i" "bootstrap seed complete"
  ) &
  BOOT_PIDS+=($!)
done
BOOT_FAIL=0
for pid in "${BOOT_PIDS[@]}"; do if ! wait "$pid"; then BOOT_FAIL=1; fi; done
if (( BOOT_FAIL )); then log_err "Bootstrap seed failed. Aborting."; exit 1; fi
PHASE5_DURATION=$(( $(date +%s) - PHASE5_START ))
log_ok "Bootstrap complete ($(fmt_duration $PHASE5_DURATION))"

# --------------------------------------------------------------------------
# Phase 6: Start service containers
# --------------------------------------------------------------------------
PHASE6_START=$(date +%s)
log_phase "Phase 6: Start service containers"

for (( i=0; i<NUM_WORKERS; i++ )); do
  prefix="e2e-w${i}"; network="${prefix}-net"
  UI_HOST_PORT=$(( 4000 + i )); BOOTSTRAP_HOST_PORT=$(( 8080 + i * 100 ))
  log_worker "$i" "starting services (ui->:$UI_HOST_PORT, bootstrap-api->:$BOOTSTRAP_HOST_PORT)"
  DB_ENV="-e DB_USER=$PG_USER -e DB_PASS=$PG_PASS -e DB_HOST=postgres -e DB_PORT=5432 -e DB_NAME=$PG_DB -e LOG_LEVEL=warn -e TIMEZONE=Europe/Warsaw"

  docker run -d --name "${prefix}-core" --network "$network" --network-alias core \
    $DB_ENV -e MIGRATE=false -e API_PORT=9102 -e HEALTH_PORT=18007 \
    -e ENABLE_DEV_API=true -e PAYMENT_SERVICE_URL=http://payment:9001 "$IMG_CORE" > /dev/null

  docker run -d --name "${prefix}-payment" --network "$network" --network-alias payment \
    $DB_ENV -e API_PORT=9001 -e HEALTH_PORT=18010 "$IMG_PAYMENT" > /dev/null

  docker run -d --name "${prefix}-gateway" --network "$network" --network-alias gateway \
    $DB_ENV -e API_PORT=9999 -e HEALTH_PORT=18009 -e CORE_SERVICE=core:9102 \
    -e PAYMENT_SERVICE=payment:9001 -e WITH_PERMISSIONS=true -e ENABLE_PERMISSIONS=true \
    -e RPG_PERMISSIONS_FLAG=true "$IMG_GATEWAY" > /dev/null

  docker run -d --name "${prefix}-bootstrap-api" --network "$network" --network-alias bootstrap-api \
    $DB_ENV -e ENABLE_DEV_API=true -e BOOTSTRAP_API_PORT=8080 -e HEALTH_PORT=18008 \
    -e CORE_API_URL=http://core:9102 -p "${BOOTSTRAP_HOST_PORT}:8080" "$IMG_BOOTSTRAP" > /dev/null

  docker run -d --name "${prefix}-ui" --network "$network" --network-alias ui \
    -e NODE_ENV=production -e BFF_URL=http://gateway:9999 -e PORT=3000 \
    -e NEXT_TELEMETRY_DISABLED=1 -p "${UI_HOST_PORT}:3000" "$IMG_UI" > /dev/null
done

# --------------------------------------------------------------------------
# Phase 7: Wait for services to become healthy
# --------------------------------------------------------------------------
log_phase "Phase 7: Wait for services to become healthy"

wait_for_port() {
  local host="$1" port="$2" name="$3" timeout="${4:-120}" elapsed=0
  while ! curl -s -o /dev/null -w '' "http://${host}:${port}" 2>/dev/null; do
    sleep 2; elapsed=$((elapsed + 2))
    if (( elapsed >= timeout )); then log_err "$name on port $port did not respond within ${timeout}s"; return 1; fi
  done
  log_ok "$name on port $port ready (${elapsed}s)"
}
HEALTH_PIDS=()
for (( i=0; i<NUM_WORKERS; i++ )); do
  UI_PORT=$(( 4000 + i )); BOOTSTRAP_PORT=$(( 8080 + i * 100 ))
  wait_for_port localhost "$UI_PORT" "UI-${i}" 120 &
  HEALTH_PIDS+=($!)
  wait_for_port localhost "$BOOTSTRAP_PORT" "Bootstrap-API-${i}" 120 &
  HEALTH_PIDS+=($!)
done
HEALTH_FAIL=0
for pid in "${HEALTH_PIDS[@]}"; do if ! wait "$pid"; then HEALTH_FAIL=1; fi; done
if (( HEALTH_FAIL )); then
  log_err "Some services failed to become healthy. Dumping logs..."
  for (( i=0; i<NUM_WORKERS; i++ )); do
    prefix="e2e-w${i}"
    for svc in core gateway payment bootstrap-api ui; do
      container="${prefix}-${svc}"
      if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
        echo -e "\n${RED}--- ${container} logs (last 30 lines) ---${NC}"
        docker logs --tail 30 "$container" 2>&1 || true
      fi
    done
  done
  exit 1
fi

PHASE6_DURATION=$(( $(date +%s) - PHASE6_START ))
INFRA_DURATION=$(( $(date +%s) - TOTAL_START ))
log_ok "All stacks healthy! ($(fmt_duration $PHASE6_DURATION))"
log "Infrastructure total: $(fmt_duration $INFRA_DURATION)"

# --------------------------------------------------------------------------
# Phase 8: Run Cypress tests
# --------------------------------------------------------------------------
PHASE8_START=$(date +%s)
log_phase "Phase 8: Run Cypress tests"

# Clean only the per-worker artifacts and merged report from the previous run.
# Preserve the current run log + historical/ archive that live in $RESULTS_DIR.
rm -rf "$RESULTS_DIR"/worker-* "$RESULTS_DIR"/mochawesome-merged.json "$RESULTS_DIR"/report.html
mkdir -p "$RESULTS_DIR"

CYPRESS_PIDS=()
for (( i=0; i<NUM_WORKERS; i++ )); do
  UI_PORT=$(( 4000 + i ))
  BOOTSTRAP_PORT=$(( 8080 + i * 100 ))
  WORKER_REPORT_DIR="$RESULTS_DIR/worker-${i}/mochawesome"
  mkdir -p "$WORKER_REPORT_DIR"

  log_worker "$i" "starting Cypress against http://localhost:$UI_PORT"

  (
    WORKER_START=$(date +%s)
    set +e
    CYPRESS_BASE_URL="http://localhost:$UI_PORT" \
    CYPRESS_BOOTSTRAP_API_URL="http://localhost:$BOOTSTRAP_PORT" \
    CYPRESS_REPORT_DIR="$WORKER_REPORT_DIR" \
    pnpm --dir tools/e2e-test exec cypress run \
      --spec "${WORKER_SPECS[$i]}" \
      > "$RESULTS_DIR/worker-${i}/cypress.log" 2>&1
    CY_EXIT=$?
    WORKER_DURATION=$(( $(date +%s) - WORKER_START ))
    echo "$CY_EXIT" > "$RESULTS_DIR/worker-${i}/exit_code"
    echo "$WORKER_DURATION" > "$RESULTS_DIR/worker-${i}/duration"
  ) &
  CYPRESS_PIDS+=($!)
done

log "Waiting for all Cypress workers to complete..."
for pid in "${CYPRESS_PIDS[@]}"; do wait "$pid" || true; done

PHASE8_DURATION=$(( $(date +%s) - PHASE8_START ))
TOTAL_DURATION=$(( $(date +%s) - TOTAL_START ))

# --------------------------------------------------------------------------
# Phase 9: Merge reports
# --------------------------------------------------------------------------
log_phase "Phase 9: Generate unified report"

# Collect all mochawesome JSON files from all workers
ALL_JSON_FILES=()
while IFS= read -r f; do
  ALL_JSON_FILES+=("$f")
done < <(find "$RESULTS_DIR" -name '*.json' -path '*/mochawesome/*' | sort)

REPORT_HTML="$RESULTS_DIR/report.html"

if (( ${#ALL_JSON_FILES[@]} > 0 )); then
  MERGED_JSON="$RESULTS_DIR/mochawesome-merged.json"

  log "Merging ${#ALL_JSON_FILES[@]} JSON report files..."
  # mochawesome-merge requires absolute paths when run from a different cwd
  ABS_JSON_FILES=()
  for f in "${ALL_JSON_FILES[@]}"; do
    ABS_JSON_FILES+=("$(cd "$(dirname "$f")" && pwd)/$(basename "$f")")
  done

  pnpm --dir tools/e2e-test exec mochawesome-merge \
    "${ABS_JSON_FILES[@]}" \
    -o "$MERGED_JSON" 2>&1 || true

  if [[ -f "$MERGED_JSON" ]]; then
    log "Generating HTML report..."
    pnpm --dir tools/e2e-test exec marge "$MERGED_JSON" \
      --reportDir "$RESULTS_DIR" \
      --reportFilename "report" \
      --inline \
      --charts 2>&1 || true
  fi
else
  log_err "No mochawesome JSON files found — skipping report generation"
fi

# --------------------------------------------------------------------------
# Phase 10: Print summary
# --------------------------------------------------------------------------
log_phase "Phase 10: Summary"

echo ""
echo -e "${BOLD}  Commit:       ${NC}${GIT_SHORT_HASH}"
echo -e "${BOLD}  Workers:      ${NC}${NUM_WORKERS}"
echo -e "${BOLD}  Total specs:  ${NC}${TOTAL_SPECS}"
echo ""
echo -e "${BOLD}  TIMING${NC}"
echo "  Docker build:        $(fmt_duration $PHASE2_DURATION)"
echo "  Postgres startup:    $(fmt_duration $PHASE3_DURATION)"
echo "  Migrations:          $(fmt_duration $PHASE4_DURATION)"
echo "  Bootstrap seed:      $(fmt_duration $PHASE5_DURATION)"
echo "  Services + health:   $(fmt_duration $PHASE6_DURATION)"
echo "  Infrastructure:      $(fmt_duration $INFRA_DURATION)"
echo "  Cypress tests:       $(fmt_duration $PHASE8_DURATION)"
echo -e "  ${BOLD}Total wall time:     $(fmt_duration $TOTAL_DURATION)${NC}"
echo ""

OVERALL_EXIT=0
for (( i=0; i<NUM_WORKERS; i++ )); do
  EXIT_FILE="$RESULTS_DIR/worker-${i}/exit_code"
  DUR_FILE="$RESULTS_DIR/worker-${i}/duration"
  LOG_FILE="$RESULTS_DIR/worker-${i}/cypress.log"

  EXIT_CODE=1; [[ -f "$EXIT_FILE" ]] && EXIT_CODE=$(cat "$EXIT_FILE")
  W_DUR=0; [[ -f "$DUR_FILE" ]] && W_DUR=$(cat "$DUR_FILE")
  W_SPEC_COUNT=$(echo "${WORKER_SPECS[$i]}" | tr ',' '\n' | wc -l | tr -d ' ')

  if (( EXIT_CODE == 0 )); then
    STATUS="${GREEN}PASSED${NC}"
  else
    STATUS="${RED}FAILED${NC}"
    OVERALL_EXIT=1
  fi

  echo -e "  Worker $i  [$STATUS]  ${W_SPEC_COUNT} specs  ($(fmt_duration $W_DUR))"

  # Show failed specs
  if [[ -f "$LOG_FILE" ]]; then
    grep '│ ✖' "$LOG_FILE" 2>/dev/null | sed 's/.*│ ✖ */    - /' | sed 's/│.*//' | sed 's/  *$//' || true
  fi
done

# WASM crash check
WASM_CRASHES=0
for (( i=0; i<NUM_WORKERS; i++ )); do
  LOG_FILE="$RESULTS_DIR/worker-${i}/cypress.log"
  if [[ -f "$LOG_FILE" ]]; then
    cnt=$(grep -c 'setUint32' "$LOG_FILE" 2>/dev/null) || cnt=0
    WASM_CRASHES=$(( WASM_CRASHES + cnt ))
  fi
done
echo ""
echo "  WASM setUint32 crashes: ${WASM_CRASHES}"

echo ""
if [[ -f "$REPORT_HTML" ]]; then
  log_ok "HTML report: ${REPORT_HTML}"
  log "  open ${REPORT_HTML}"
else
  log "Worker logs: ${RESULTS_DIR}/worker-*/cypress.log"
fi

echo ""
if (( OVERALL_EXIT == 0 )); then
  log_ok "ALL WORKERS PASSED"
else
  log_err "SOME WORKERS FAILED"
fi

exit $OVERALL_EXIT
