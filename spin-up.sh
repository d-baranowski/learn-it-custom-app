#!/usr/bin/env bash

# Fail fast:
# -e: exit on any non-zero command
# -u: error on unset variables
# -o pipefail: pipelines fail if any element fails
set -euo pipefail

# Find the repository root by looking for nx.json
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"

# Walk up the directory tree to find nx.json
while [[ "$REPO_ROOT" != "/" ]]; do
    if [[ -f "$REPO_ROOT/nx.json" ]]; then
        break
    fi
    REPO_ROOT="$(dirname "$REPO_ROOT")"
done

# Verify we found the repository root
if [[ ! -f "$REPO_ROOT/nx.json" ]]; then
    echo "Error: Could not find repository root (nx.json not found)"
    exit 1
fi

# Change to repository root
cd "$REPO_ROOT" || exit 1

echo "Running from repository root: $REPO_ROOT"

export NX_TUI=false

# Per-worktree registry: ensures docker compose project name + host ports
# don't clash with another worktree's stack.
UTRO_REPO_ROOT="$REPO_ROOT"
export UTRO_REPO_ROOT
# shellcheck disable=SC1091
. "$REPO_ROOT/tools/stack/registry.sh"
ensure_registry
export_stack_env

echo "[spin-up] stack '$STACK_ID' — postgres:$POSTGRES_HOST_PORT redis:$REDIS_HOST_PORT pgadmin:$PGADMIN_HOST_PORT otel:$OTEL_HTTP_HOST_PORT grafana:$GRAFANA_HOST_PORT compose-project:$COMPOSE_PROJECT_NAME"

# Run the commands
nx reset
nx run-many -t generate --skip-nx-cache
docker-compose down --volumes
docker-compose up -d
nx run-many -t migrate --skip-nx-cache --parallel=1
nx run form-validator:build
cp tools/wasm/form-validator/dist/form-validator.wasm app/ui/public/wasm
# Run bootstrap in normal mode (not DEV_API mode) - it will run once and exit.
# SEED_E2E_SESSIONS seeds the fixed long-lived auth sessions Cypress relies on.
USER=postgres ENABLE_DEV_API=false SEED_E2E_SESSIONS=true go run ./app/bootstrap/cmd/main.go
