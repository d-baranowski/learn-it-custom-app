#!/usr/bin/env bash
# Inherit container images from the PR that produced this main commit.
#
# When a PR is squash-merged, GitHub creates a new commit on main with a
# different SHA but identical tree to the PR head. Rather than rebuild the
# containers from scratch (10-20 min), find the merging PR via the GitHub
# commits-to-PR API and retag its already-built and already-E2E-validated
# images as `:main` and `:main-<short-main-sha>`. The downstream Release
# stage then proceeds against those tags exactly as if a fresh build had
# happened.
#
# Squash-merge is enforced as a repo policy. If this commit isn't backed by
# a merged PR (direct push to main, force push, etc.) we refuse to proceed —
# there are no source images to inherit and skipping the rebuild would
# silently use whatever stale `:main` happened to be in GHCR. Fail loudly
# instead.
#
# Required env vars (all set by the calling Jenkinsfile):
#   GHCR_IMAGE_PREFIX   e.g. ghcr.io/inspiration-particle/utro
#   IMAGE_TAG_SHA       e.g. main-d464bc9 (the new tag to mint for these images)
#   GIT_COMMIT          full SHA of the main commit being built
#   GITHUB_REPO         e.g. inspiration-particle/utro
#   GITHUB_TOKEN        PAT with contents:read
#   GHCR_USER, GHCR_TOKEN  GHCR push creds (for `imagetools create`)

set -euo pipefail

: "${GHCR_IMAGE_PREFIX:?required}"
: "${IMAGE_TAG_SHA:?required}"
: "${GIT_COMMIT:?required}"
: "${GITHUB_REPO:?required}"
: "${GITHUB_TOKEN:?required}"
: "${GHCR_USER:?required}"
: "${GHCR_TOKEN:?required}"

SERVICES=(core gateway payment bootstrap notification ui core-event)

export GH_TOKEN="${GITHUB_TOKEN}"

# GitHub commits-to-PR resolution: returns PRs that contain the given commit
# regardless of merge style. For squash-merged main, this is the merging PR.
# Take the most recently merged one in case multiple PRs reference this commit.
echo "[inherit] looking up PR for commit ${GIT_COMMIT}"
PR_NUMBER="$(gh api -H 'Accept: application/vnd.github+json' \
  "repos/${GITHUB_REPO}/commits/${GIT_COMMIT}/pulls" \
  --jq '[.[] | select(.merged_at)] | sort_by(.merged_at) | last | .number' \
  || true)"
PR_HEAD_SHA="$(gh api -H 'Accept: application/vnd.github+json' \
  "repos/${GITHUB_REPO}/commits/${GIT_COMMIT}/pulls" \
  --jq '[.[] | select(.merged_at)] | sort_by(.merged_at) | last | .head.sha' \
  || true)"
PR_HEAD_REF="$(gh api -H 'Accept: application/vnd.github+json' \
  "repos/${GITHUB_REPO}/commits/${GIT_COMMIT}/pulls" \
  --jq '[.[] | select(.merged_at)] | sort_by(.merged_at) | last | .head.ref' \
  || true)"

if [ -z "${PR_NUMBER}" ] || [ "${PR_NUMBER}" = "null" ]; then
  echo "[inherit] FATAL: no merged PR found for commit ${GIT_COMMIT}." >&2
  echo "[inherit] Squash-merge is enforced for main; a direct push has no" >&2
  echo "[inherit] containers to inherit. Refusing to release." >&2
  exit 1
fi

echo "[inherit] PR #${PR_NUMBER} (head ${PR_HEAD_REF} @ ${PR_HEAD_SHA})"

# Compute the IMAGE_TAG that the PR build pushed under. Must match the Prepare
# stage's logic exactly:
#   - branch contains "UTR-XXXXXX"  → tag = "UTR-XXXXXX"
#   - branch == "main"              → tag = "main"   (PR-from-main, edge case)
#   - else                          → tag = sanitized branch name
#                                            (Jenkinsfile uses
#                                             /[^A-Za-z0-9._-]/ → '-')
SRC_IMAGE_TAG=""
if echo "${PR_HEAD_REF}" | grep -Eq 'UTR-[0-9]{6}'; then
  SRC_IMAGE_TAG="$(echo "${PR_HEAD_REF}" | grep -oE 'UTR-[0-9]{6}' | head -n 1)"
elif [ "${PR_HEAD_REF}" = "main" ]; then
  SRC_IMAGE_TAG="main"
else
  SRC_IMAGE_TAG="$(echo "${PR_HEAD_REF}" | sed -E 's/[^A-Za-z0-9._-]/-/g')"
fi
SRC_SHA_SHORT="${PR_HEAD_SHA:0:7}"
SRC_IMAGE_TAG_SHA="${SRC_IMAGE_TAG}-${SRC_SHA_SHORT}"

echo "[inherit] source: ${GHCR_IMAGE_PREFIX}-<svc>:${SRC_IMAGE_TAG_SHA}"
echo "[inherit] target: :main, :${IMAGE_TAG_SHA}"

# Set up GHCR auth in an ephemeral DOCKER_CONFIG so the token doesn't linger.
DOCKER_CONFIG="$(mktemp -d)"
export DOCKER_CONFIG
trap 'rm -rf "$DOCKER_CONFIG"' EXIT
AUTH="$(printf '%s:%s' "$GHCR_USER" "$GHCR_TOKEN" | base64 | tr -d '\n')"
printf '{"auths":{"ghcr.io":{"auth":"%s"}}}\n' "$AUTH" > "$DOCKER_CONFIG/config.json"

# `imagetools create` aliases the existing manifest under new tags without
# rebuilding, and preserves multi-arch indexes. If the source tag is missing
# from GHCR (older PR with images already pruned), this fails — accepted
# tradeoff: the PR can be retriggered to rebuild.
for app in "${SERVICES[@]}"; do
  SRC="${GHCR_IMAGE_PREFIX}-${app}:${SRC_IMAGE_TAG_SHA}"
  echo "[inherit] retagging ${app}: ${SRC} -> :main, :${IMAGE_TAG_SHA}"
  docker buildx imagetools create \
    --tag "${GHCR_IMAGE_PREFIX}-${app}:main" \
    --tag "${GHCR_IMAGE_PREFIX}-${app}:${IMAGE_TAG_SHA}" \
    "${SRC}"
done

echo "[inherit] done — main containers now point at PR #${PR_NUMBER}'s images"
