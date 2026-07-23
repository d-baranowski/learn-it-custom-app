#!/usr/bin/env bash
# Bump version, retag GHCR images already pushed by the build pipeline,
# push a git tag, create a GitHub release.
#
# Usage: release.sh <patch|minor|major>
#
# Required env vars (all set by the calling Jenkinsfile via withCredentials):
#   GHCR_IMAGE_PREFIX  e.g. ghcr.io/inspiration-particle/utro
#   IMAGE_TAG_SHA      e.g. main-a1b2c3d  (the immutable per-commit tag the
#                                          Containers stage just pushed)
#   GIT_COMMIT         full SHA being released
#   GITHUB_REPO        e.g. inspiration-particle/utro
#   GITHUB_TOKEN       PAT with Contents: write
#   GHCR_USER, GHCR_TOKEN  GHCR push creds (for `imagetools create`)

set -euo pipefail

BUMP_TYPE="${1:?usage: release.sh <patch|minor|major>}"
case "$BUMP_TYPE" in
  patch|minor|major) ;;
  *) echo "[release] invalid bump type: $BUMP_TYPE" >&2; exit 1 ;;
esac

: "${GHCR_IMAGE_PREFIX:?required}"
: "${IMAGE_TAG_SHA:?required}"
: "${GIT_COMMIT:?required}"
: "${GITHUB_REPO:?required}"
: "${GITHUB_TOKEN:?required}"
: "${GHCR_USER:?required}"
: "${GHCR_TOKEN:?required}"

SERVICES=(core gateway payment bootstrap notification ui core-event)

# Make sure tags from origin are present — Jenkins multibranch checkout doesn't
# always include them, and `git describe` would otherwise fall through to v0.0.0
# and we'd silently lose continuity with the existing release timeline. Use the
# PAT URL explicitly because the workspace's `origin` is configured via SSH /
# anonymous HTTPS with no read auth, so a plain `git fetch origin` 401s.
git fetch --tags --quiet \
  "https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git" \
  || echo "[release] WARNING: tag fetch failed; git describe may fall back to v0.0.0"

# Annotated tags carry author + committer fields — git refuses to create one
# without an identity. CI agents typically don't have user.email / user.name
# set globally, so feed identity in via env vars (scoped to this script run,
# not persisted to git config). Defaults can be overridden by the calling
# Jenkinsfile if you want a different identity per environment.
export GIT_AUTHOR_NAME="${GIT_AUTHOR_NAME:-edwardelriczeroclaw-spec}"
export GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-edward.elric.zeroclaw@gmail.com}"
export GIT_COMMITTER_NAME="${GIT_COMMITTER_NAME:-$GIT_AUTHOR_NAME}"
export GIT_COMMITTER_EMAIL="${GIT_COMMITTER_EMAIL:-$GIT_AUTHOR_EMAIL}"

# Patch is auto-triggered on every main push. If the manual minor/major job has
# already tagged this exact commit, don't pile a stray patch tag on top.
# Minor/major are user-initiated and always proceed (with a guard against
# double-tagging at the SAME bump level, handled by `git tag` itself failing).
if [ "$BUMP_TYPE" = "patch" ]; then
  EXISTING="$(git tag --points-at "$GIT_COMMIT" --list 'v*' | head -n 1 || true)"
  if [ -n "$EXISTING" ]; then
    echo "[release] commit $GIT_COMMIT already tagged $EXISTING — skipping auto-patch."
    exit 0
  fi
fi

PREV="$(git describe --tags --match 'v*' --abbrev=0 2>/dev/null || echo v0.0.0)"
PREV_NUM="${PREV#v}"
IFS='.' read -r MAJOR MINOR PATCH <<< "$PREV_NUM"

case "$BUMP_TYPE" in
  major) NEXT="$((MAJOR+1)).0.0" ;;
  minor) NEXT="${MAJOR}.$((MINOR+1)).0" ;;
  patch) NEXT="${MAJOR}.${MINOR}.$((PATCH+1))" ;;
esac
NEXT_TAG="v${NEXT}"

echo "[release] previous: ${PREV}"
echo "[release] next:     ${NEXT_TAG}"
echo "[release] commit:   ${GIT_COMMIT}"
echo "[release] bump:     ${BUMP_TYPE}"

# --- Retag GHCR images. `imagetools create` aliases the existing manifest
# without rebuilding, and preserves multi-arch indexes when the source is one.
DOCKER_CONFIG="$(mktemp -d)"
export DOCKER_CONFIG
trap 'rm -rf "$DOCKER_CONFIG"' EXIT
AUTH="$(printf '%s:%s' "$GHCR_USER" "$GHCR_TOKEN" | base64 | tr -d '\n')"
printf '{"auths":{"ghcr.io":{"auth":"%s"}}}\n' "$AUTH" > "$DOCKER_CONFIG/config.json"

for app in "${SERVICES[@]}"; do
  SRC="${GHCR_IMAGE_PREFIX}-${app}:${IMAGE_TAG_SHA}"
  echo "[release] retagging ${app}: ${SRC} -> :${NEXT}, :latest"
  docker buildx imagetools create \
    --tag "${GHCR_IMAGE_PREFIX}-${app}:${NEXT}" \
    --tag "${GHCR_IMAGE_PREFIX}-${app}:latest" \
    "${SRC}"
done

# --- Push the git tag using the PAT, regardless of how the workspace was
# cloned (SSH deploy key, https without creds, etc.).
echo "[release] pushing git tag ${NEXT_TAG} -> ${GIT_COMMIT}"
git tag -a "${NEXT_TAG}" -m "Release ${NEXT_TAG}" "${GIT_COMMIT}"
git push "https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git" "${NEXT_TAG}"

# --- GitHub release with auto-generated notes.
export GH_TOKEN="${GITHUB_TOKEN}"
RELEASE_ARGS=(
  -R "${GITHUB_REPO}"
  --target "${GIT_COMMIT}"
  --title "${NEXT_TAG}"
  --generate-notes
)
# `--notes-start-tag` only makes sense if the previous tag actually exists on
# the remote. The v0.0.0 fallback above is a sentinel, not a real tag.
if [ "${PREV}" != "v0.0.0" ]; then
  RELEASE_ARGS+=(--notes-start-tag "${PREV}")
fi
echo "[release] creating GitHub release ${NEXT_TAG}"
gh release create "${NEXT_TAG}" "${RELEASE_ARGS[@]}"

echo "[release] done — ${NEXT_TAG}"
