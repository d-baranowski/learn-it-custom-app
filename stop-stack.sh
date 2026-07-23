#!/usr/bin/env bash
#
# Stop the dev stack thoroughly (scoped to the current worktree).
#
# Why this is more than `tmux kill-session`:
#   `go run` compiles a binary to a temp dir and execs it as a child of the
#   shell. `air` does the same. `next dev` forks workers. When tmux kills a
#   pane it sends SIGHUP to the foreground process group, but Go binaries
#   ignore SIGHUP by default, and detached children frequently outlive the
#   shell — leaving stale processes holding service ports.
#
# Strategy:
#   1. Resolve the current worktree's registry (~/.utro-stacks/<id>/) to
#      learn its tmux session name, allocated ports, and compose project.
#   2. For each pane in that session, walk the descendant process tree.
#      SIGTERM, wait, then SIGKILL anything still alive.
#   3. Kill the tmux session.
#   4. Belt-and-braces: kill anything still listening on this stack's ports.
#
# Docker infra (postgres/redis/pgadmin) is intentionally NOT torn down by
# default — keeps the DB warm so the next run-stack reattaches without a
# re-spin-up. Pass --purge for a full reset (compose teardown + registry
# delete + fresh ports on next run-stack).

set -uo pipefail

PURGE=false
for arg in "$@"; do
  case "$arg" in
    --purge) PURGE=true ;;
    -h|--help)
      cat <<EOF
Usage: $(basename "$0") [--purge]

Stop the dev stack belonging to the current worktree.

By default this stops the app services (gateway/core/ui/bootstrap/payment)
and leaves the docker-compose infra (postgres/redis/pgadmin) running, so
the next ./run-stack.sh reattaches to the warm DB.

  --purge   Also tear down the docker-compose project AND delete the stack's
            port registry. Next run-stack will allocate fresh ports and
            require a re-spin-up to repopulate the DB.
EOF
      exit 0
      ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "$(readlink -f "$0" 2>/dev/null || echo "$0")")" && pwd)"
STATE_FILE="$REPO_ROOT/.stack-sessions"

UTRO_REPO_ROOT="$REPO_ROOT"
export UTRO_REPO_ROOT
# shellcheck disable=SC1091
. "$REPO_ROOT/tools/stack/registry.sh"

STACK_DIR_PATH="$(stack_dir)"
SESSION_FROM_REGISTRY=""
COMPOSE_PROJECT_FROM_REGISTRY=""
PORTS=()

if [ -f "$STACK_DIR_PATH/stack.env" ]; then
  # shellcheck disable=SC1090
  . "$STACK_DIR_PATH/stack.env"
  SESSION_FROM_REGISTRY="${STACK_TMUX_SESSION:-}"
  COMPOSE_PROJECT_FROM_REGISTRY="${COMPOSE_PROJECT_NAME:-}"
  # Collect ports for the sweep. POSTGRES/REDIS/PGADMIN HOST ports are owned
  # by Docker Desktop, not our services — sweeping them would SIGTERM Docker
  # itself. Include those only on --purge (when we've already torn down the
  # compose project, so the ports are no longer held).
  if $PURGE; then
    while IFS= read -r p; do
      [ -n "$p" ] && PORTS+=("$p")
    done < <(awk -F= '/_PORT=/ { print $2 }' "$STACK_DIR_PATH/stack.env")
  else
    for v in GATEWAY_API_PORT GATEWAY_HEALTH_PORT \
             CORE_API_PORT CORE_HEALTH_PORT \
             BOOTSTRAP_API_PORT BOOTSTRAP_HEALTH_PORT \
             PAYMENT_API_PORT PAYMENT_HEALTH_PORT \
             UI_PORT; do
      eval "p=\${$v:-}"
      [ -n "$p" ] && PORTS+=("$p")
    done
  fi
fi

# Build the session list: registry's session first, then anything in
# .stack-sessions, then legacy names from before the registry existed.
SESSIONS=()
[ -n "$SESSION_FROM_REGISTRY" ] && SESSIONS+=("$SESSION_FROM_REGISTRY")

if [ -f "$STATE_FILE" ]; then
  while IFS= read -r line; do
    [ -n "$line" ] && SESSIONS+=("$line")
  done < "$STATE_FILE"
fi
# Legacy-name fallback (pre-registry installs): only consult these if THIS
# worktree has no registry yet — otherwise we'd kill another worktree's
# `__utro-stack__` session, which is exactly what we're trying to avoid in
# multi-worktree setups.
if [ ! -f "$STACK_DIR_PATH/stack.env" ]; then
  for legacy in "__utro-stack__" "__utro-stack__hot" "__utro-stack__spin-up" "run-stack" "run-stack-hot"; do
    if tmux has-session -t "=$legacy" 2>/dev/null; then
      SESSIONS+=("$legacy")
    fi
  done
fi
# Deduplicate.
if [ "${#SESSIONS[@]}" -gt 0 ]; then
  SESSIONS=($(printf '%s\n' "${SESSIONS[@]}" | sort -u))
fi

# Fallback ports (used when no registry exists — typical for first-ever stop
# after a checkout, or for cleaning up legacy single-stack installs).
if [ "${#PORTS[@]}" -eq 0 ]; then
  PORTS=(9999 9102 9001 9000 18007 18008)
fi

# Process name patterns we may have spawned. The sweep below filters these
# by working-directory so we only kill processes rooted in THIS repo —
# patterns like "next-server" or "go-build/exe/main" are otherwise far too
# generic and would clobber unrelated dev work.
NAME_PATTERNS=(
  "go-build.*/exe/main"   # `go run` compiled output in $TMPDIR/go-build*
  "air -c air.toml"
  "next-server"
  "next dev"
  "nx\.js run [a-z]+:dev" # nx dev wrappers (core:dev, gateway:dev, ui:dev, …)
)

log() { printf '[stop-stack] %s\n' "$*"; }

# Collect all descendants of a PID (including itself), portable for macOS.
descendants() {
  local pid="$1"
  local kids
  kids=$(pgrep -P "$pid" 2>/dev/null || true)
  echo "$pid"
  for k in $kids; do
    descendants "$k"
  done
}

kill_tree() {
  local root="$1" sig="$2"
  local pids
  pids=$(descendants "$root" | sort -u)
  for p in $pids; do
    [ -n "$p" ] && kill "-$sig" "$p" 2>/dev/null || true
  done
}

stop_session() {
  local session="$1"
  # `tmux has-session -t NAME` does PREFIX matching (so `-t run-stack` would
  # match an existing `run-stack-hot`). Use `=NAME` for an exact match,
  # otherwise we'd run stop logic twice against the same session.
  if ! tmux has-session -t "=$session" 2>/dev/null; then
    return 0
  fi

  log "Session '$session' found — killing pane process trees"

  # Gather pane PIDs first; if we kill them after kill-session we lose them.
  local pane_pids
  pane_pids=$(tmux list-panes -s -t "$session" -F '#{pane_pid}' 2>/dev/null || true)

  for pid in $pane_pids; do
    kill_tree "$pid" TERM
  done

  # Give services a moment to shut down cleanly.
  sleep 2

  for pid in $pane_pids; do
    kill_tree "$pid" KILL
  done

  # Detach any clients currently inside this session so we don't drop into
  # a broken state, then kill it.
  if [ -n "${TMUX:-}" ]; then
    local current
    current=$(tmux display-message -p '#S' 2>/dev/null || echo "")
    if [ "$current" = "$session" ]; then
      tmux detach-client -s "$session" &
    fi
  fi

  tmux kill-session -t "$session" 2>/dev/null && log "Killed tmux session '$session'"
}

stop_compose() {
  local project="$1"
  [ -z "$project" ] && return 0
  log "Tearing down docker compose project '$project'"
  ( cd "$REPO_ROOT" && COMPOSE_PROJECT_NAME="$project" docker-compose down >/dev/null 2>&1 || true )
}

sweep_ports() {
  log "Sweeping leftover processes on ports: ${PORTS[*]}"
  for port in "${PORTS[@]}"; do
    # macOS lsof: -t prints PIDs only, -i :PORT filters by port, -sTCP:LISTEN
    # restricts to listeners (avoids killing curl clients etc).
    local pids
    pids=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)
    if [ -n "$pids" ]; then
      log "  port $port held by: $(echo "$pids" | tr '\n' ' ')— SIGTERM"
      echo "$pids" | xargs -I{} kill -TERM {} 2>/dev/null || true
    fi
  done

  sleep 1

  for port in "${PORTS[@]}"; do
    local pids
    pids=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)
    if [ -n "$pids" ]; then
      log "  port $port still held — SIGKILL"
      echo "$pids" | xargs -I{} kill -KILL {} 2>/dev/null || true
    fi
  done
}

# Returns the cwd of a pid on macOS, or empty if it can't be read.
proc_cwd() {
  lsof -a -d cwd -p "$1" -Fn 2>/dev/null | awk '/^n/ {sub(/^n/,""); print; exit}'
}

sweep_names() {
  log "Sweeping leftover processes by name (scoped to $REPO_ROOT)"
  for pat in "${NAME_PATTERNS[@]}"; do
    local candidates
    candidates=$(pgrep -f "$pat" 2>/dev/null || true)
    [ -z "$candidates" ] && continue

    local matched=""
    for pid in $candidates; do
      local cwd
      cwd=$(proc_cwd "$pid")
      # Match only if cwd is the repo root or a subdirectory of it.
      case "$cwd" in
        "$REPO_ROOT"|"$REPO_ROOT"/*)
          matched="$matched $pid"
          ;;
      esac
    done

    if [ -n "$matched" ]; then
      log "  pattern '$pat' matched (in-repo):$matched — SIGKILL"
      for pid in $matched; do
        kill -KILL "$pid" 2>/dev/null || true
      done
    fi
  done
}

any_session=false
for s in "${SESSIONS[@]+"${SESSIONS[@]}"}"; do
  if tmux has-session -t "=$s" 2>/dev/null; then
    any_session=true
  fi
  stop_session "$s"
done

if ! $any_session; then
  log "No stack tmux sessions running — sweeping anyway in case of orphans"
fi

if $PURGE; then
  stop_compose "$COMPOSE_PROJECT_FROM_REGISTRY"
fi
sweep_ports
sweep_names

# Clear the legacy state file now that everything is stopped.
rm -f "$STATE_FILE"

if $PURGE && [ -d "$STACK_DIR_PATH" ]; then
  log "Purging registry $STACK_DIR_PATH"
  rm -rf "$STACK_DIR_PATH"
fi

log "Done."
