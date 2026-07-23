#!/usr/bin/env bash
# Run a command with the current worktree's stack env exported.
#
# Usage:
#   tools/stack/with-stack-env.sh <command> [args...]
#
# Example:
#   tools/stack/with-stack-env.sh cypress run --spec foo.cy.ts
#   tools/stack/with-stack-env.sh psql "$DB_URL"
#
# Locates the worktree's registry at ~/.utro-stacks/<id>/stack.env (where <id>
# is derived from the worktree root). Errors out if no registry exists —
# meaning run-stack.sh has never been invoked in this worktree.

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $(basename "$0") <command> [args...]" >&2
  exit 2
fi

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
UTRO_REPO_ROOT="$REPO_ROOT"
export UTRO_REPO_ROOT

# shellcheck disable=SC1091
. "$REPO_ROOT/tools/stack/registry.sh"

if [ ! -f "$(stack_dir)/stack.env" ]; then
  echo "[with-stack-env] no registry for this worktree — run ./run-stack.sh first" >&2
  echo "[with-stack-env] expected: $(stack_dir)/stack.env" >&2
  exit 1
fi

export_stack_env
exec "$@"
