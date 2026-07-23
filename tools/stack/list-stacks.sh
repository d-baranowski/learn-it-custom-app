#!/usr/bin/env bash
# List all known utro stacks (one per worktree that ever ran run-stack.sh).
# Marks the one matching the current working directory.

set -uo pipefail

: "${UTRO_STACKS_HOME:=$HOME/.utro-stacks}"

if [ ! -d "$UTRO_STACKS_HOME" ]; then
  echo "No stacks registered (no $UTRO_STACKS_HOME)."
  exit 0
fi

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
CURRENT_ID=$(printf '%s' "$REPO_ROOT" | shasum | cut -c1-8)

printf '%-10s %-7s %-8s %-8s %-8s %s\n' 'ID' 'TMUX' 'GATEWAY' 'UI' 'POSTGRES' 'WORKTREE'
printf '%s\n' '──────────────────────────────────────────────────────────────────────────────'

shopt -s nullglob
for dir in "$UTRO_STACKS_HOME"/*/; do
  id=$(basename "$dir")
  env_file="$dir/stack.env"
  [ -f "$env_file" ] || continue

  # shellcheck disable=SC1090
  ( . "$env_file"
    session_state="-"
    if tmux has-session -t "=${STACK_TMUX_SESSION:-}" 2>/dev/null; then
      session_state="up"
    fi
    marker=""
    [ "$id" = "$CURRENT_ID" ] && marker=" *"
    printf '%-10s %-7s %-8s %-8s %-8s %s%s\n' \
      "$id" \
      "$session_state" \
      "${GATEWAY_API_PORT:-?}" \
      "${UI_PORT:-?}" \
      "${POSTGRES_HOST_PORT:-?}" \
      "${STACK_WORKTREE:-?}" \
      "$marker"
  )
done

echo
echo "* = current worktree"
