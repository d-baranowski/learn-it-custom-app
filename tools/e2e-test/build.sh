#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IMAGE_TAG="${IMAGE_TAG:-local}"
REGISTRY="${IMAGE_REGISTRY:-ghcr.io/inspiration-particle}"

GO_SERVICES=(core gateway payment bootstrap notification)

echo "=== Building E2E images (tag: ${IMAGE_TAG}) ==="

# Generate protobuf code (required by Go and UI builds)
echo "--- Generating protobuf code ---"
cd "$REPO_ROOT"
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
npx nx run-many -t generate --skip-nx-cache

# Go services — shared Dockerfile, parallel builds
echo "--- Building Go services ---"
for svc in "${GO_SERVICES[@]}"; do
  echo "  building ${svc}..."
  docker build -q \
    -t "${REGISTRY}/utro-${svc}:${IMAGE_TAG}" \
    --build-arg APP_NAME="${svc}" \
    -f docker/Dockerfile . &
done
wait
echo "  Go services built"

# UI
echo "--- Building UI ---"
docker build -q \
  -t "${REGISTRY}/utro-ui:${IMAGE_TAG}" \
  -f app/ui/Dockerfile app/ui/
echo "  UI built"

echo ""
echo "=== Done. Start the stack with: ==="
echo "  cd tools/e2e-test && IMAGE_TAG=${IMAGE_TAG} docker compose up -d"
