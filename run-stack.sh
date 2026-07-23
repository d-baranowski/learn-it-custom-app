#!/usr/bin/env bash

set -euo pipefail

# Always run from the directory containing this script, so tmux panes
# start in the utro repo regardless of where the script was invoked from
# (e.g. via a tmux `bind r run-shell ...` keybinding, where the cwd would
# otherwise be inherited from the tmux server).
cd "$(dirname "$(readlink -f "$0" 2>/dev/null || echo "$0")")"

DISABLE_HOT=false
for arg in "$@"; do
  case "$arg" in
    --disable-hot) DISABLE_HOT=true ;;
    -h|--help)
      cat <<EOF
Usage: $(basename "$0") [--disable-hot]

Spin up the full Utro dev stack in a tmux session.

Hot reload is on by default (Air for Go services, nx dev for gateway/core).
Pass --disable-hot to run every Go service via plain 'go run' instead.

Each worktree gets its own port set + tmux session + Docker compose project,
so multiple stacks can run side-by-side. Run ./tools/stack/list-stacks.sh
to see all active stacks.
EOF
      exit 0
      ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

# Per-worktree registry: allocates a unique set of ports and persists them
# in ~/.utro-stacks/<id>/stack.env. Idempotent across runs.
UTRO_REPO_ROOT="$PWD"
export UTRO_REPO_ROOT
# shellcheck disable=SC1091
. "$UTRO_REPO_ROOT/tools/stack/registry.sh"
ensure_registry
export_stack_env

SESSION="$STACK_TMUX_SESSION"
STATE_FILE="$PWD/.stack-sessions"

# Defensive defaults for older stack.env files. registry.sh now migrates these,
# but guard here to avoid hard failures under `set -u`.
NOTIFICATION_API_PORT="${NOTIFICATION_API_PORT:-}"
NOTIFICATION_HEALTH_PORT="${NOTIFICATION_HEALTH_PORT:-}"
NOTIFICATION_ENABLED=true
if [ -z "$NOTIFICATION_API_PORT" ] || [ -z "$NOTIFICATION_HEALTH_PORT" ]; then
  NOTIFICATION_ENABLED=false
fi

# Ensure this stack's docker-compose infra (postgres/redis/pgadmin) is up.
# `docker-compose up -d` is idempotent: a no-op if containers already
# running, brings them back up if stop-stack --purge tore them down. Without
# this, services would crash on DB connection-refused after a purge.
echo "[run-stack] ensuring docker-compose project '$COMPOSE_PROJECT_NAME' is up"
docker-compose up -d >/dev/null
# Wait briefly for postgres health before letting services try to connect.
for i in $(seq 1 30); do
  if [ -n "$(docker ps --filter "label=com.docker.compose.project=$COMPOSE_PROJECT_NAME" --filter "name=postgres" --filter "health=healthy" --format '{{.ID}}' 2>/dev/null)" ]; then
    echo "[run-stack] postgres healthy after ${i}s"
    break
  fi
  [ "$i" = "30" ] && echo "[run-stack] WARN: postgres not healthy after 30s — services may fail to connect" >&2
  sleep 1
done

# If the session already exists, just attach/switch to it instead of rebuilding.
# Done before the port pre-flight so re-attaching to a running stack doesn't
# trip the "ports in use" check (they're our own ports).
if tmux has-session -t "$SESSION" 2>/dev/null; then
  if [ -n "${TMUX:-}" ]; then
    exec tmux switch-client -t "$SESSION"
  else
    exec tmux attach-session -t "$SESSION"
  fi
fi

# Sanity: another process must not already hold the ports run-stack itself
# is about to bind to. (Stale stack from a different worktree, or unrelated
# dev server.) Fail loud rather than letting individual services crash
# mid-launch.
#
# Infra ports (postgres/redis/pgadmin) are intentionally NOT in this list:
# they're owned by spin-up.sh's docker-compose containers, which would still
# be holding them at this point — so checking them here would always fail
# the moment spin-up has run.
preflight_ports=("$GATEWAY_API_PORT" "$CORE_API_PORT" "$CORE_HEALTH_PORT" \
  "$BOOTSTRAP_HEALTH_PORT" "$PAYMENT_API_PORT" "$UI_PORT")
if $NOTIFICATION_ENABLED; then
  preflight_ports+=("$NOTIFICATION_API_PORT")
fi
held=""
for p in "${preflight_ports[@]}"; do
  if lsof -nP -iTCP:"$p" -sTCP:LISTEN -t >/dev/null 2>&1; then
    held="$held $p"
  fi
done
if [ -n "$held" ]; then
  echo "[run-stack] ports already in use:$held" >&2
  echo "[run-stack] another stack may be running — check ./tools/stack/list-stacks.sh" >&2
  echo "[run-stack] or stop it first with ./stop-stack.sh from the owning worktree." >&2
  exit 1
fi

# UI dev server expects PORT, not UI_PORT. Set it for the UI pane only —
# don't leak into the global env (would collide with backend services that
# use PORT-style names).
UI_PANE_PORT="$UI_PORT"

# Per-service env prefixes. API_PORT / HEALTH_PORT are baked in here (not in
# stack.env) because each service interprets them differently — exporting
# them globally would cause core to bind on the gateway port and so on.
GATEWAY_ENV="API_PORT=$GATEWAY_API_PORT HEALTH_PORT=$GATEWAY_HEALTH_PORT"
CORE_ENV="API_PORT=$CORE_API_PORT HEALTH_PORT=$CORE_HEALTH_PORT"
BOOTSTRAP_ENV="BOOTSTRAP_API_PORT=$BOOTSTRAP_API_PORT HEALTH_PORT=$BOOTSTRAP_HEALTH_PORT SEED_E2E_SESSIONS=true"
PAYMENT_ENV="API_PORT=$PAYMENT_API_PORT HEALTH_PORT=$PAYMENT_HEALTH_PORT"
NOTIFICATION_ENV=""
if $NOTIFICATION_ENABLED; then
  NOTIFICATION_ENV="API_PORT=$NOTIFICATION_API_PORT HEALTH_PORT=$NOTIFICATION_HEALTH_PORT"
fi
CORE_EVENT_ENV="HEALTH_PORT=${CORE_EVENT_HEALTH_PORT:-18010}"
if $DISABLE_HOT; then
  GATEWAY_CMD="$GATEWAY_ENV ENV_FILE=./app/gateway/.env.dev go run app/gateway/cmd/main.go"
  CORE_CMD="$CORE_ENV ENABLE_DEV_API=true USER=postgres ENV_FILE=app/core/.env.dev go run app/core/cmd/main.go"
  PAYMENT_CMD="$PAYMENT_ENV ENV_FILE=./.env.dev go run cmd/main.go"
  NOTIFICATION_CMD=""
  if $NOTIFICATION_ENABLED; then
    NOTIFICATION_CMD="$NOTIFICATION_ENV ENABLE_DEV_API=true ENV_FILE=./.env.dev go run cmd/main.go"
  fi
  CORE_EVENT_CMD="$CORE_EVENT_ENV USER=postgres ENV_FILE=./.env.dev go run cmd/main.go"
  GATEWAY_TITLE='Gateway'
  CORE_TITLE='Core'
  PAYMENT_TITLE='Payment'
  NOTIFICATION_TITLE='Notification'
  CORE_EVENT_TITLE='Core-Event'
else
  GATEWAY_CMD="$GATEWAY_ENV nx run gateway:dev"
  CORE_CMD="$CORE_ENV ENABLE_DEV_API=true nx run core:dev"
  PAYMENT_CMD="$PAYMENT_ENV USER=postgres ENV_FILE=./.env.dev air -c air.toml"
  NOTIFICATION_CMD=""
  if $NOTIFICATION_ENABLED; then
    NOTIFICATION_CMD="$NOTIFICATION_ENV USER=postgres ENABLE_DEV_API=true ENV_FILE=./.env.dev air -c air.toml"
  fi
  CORE_EVENT_CMD="$CORE_EVENT_ENV USER=postgres ENV_FILE=./.env.dev air -c air.toml"
  GATEWAY_TITLE='Gateway (hot)'
  CORE_TITLE='Core (hot)'
  PAYMENT_TITLE='Payment (hot)'
  NOTIFICATION_TITLE='Notification (hot)'
  CORE_EVENT_TITLE='Core-Event (hot)'
fi

# Build `-e KEY=VAL` args so the new tmux session — and every pane it
# spawns via split-window — sees the registry env vars. We can't use
# `tmux set-environment` after the fact: the first pane's shell would
# already be running and would not pick up retroactive changes.
TMUX_ENV_ARGS=()
while IFS='=' read -r key val; do
  case "$key" in
    ''|\#*) continue ;;
  esac
  val="${val%\"}"; val="${val#\"}"
  TMUX_ENV_ARGS+=("-e" "$key=$val")
done < "$(stack_dir)/stack.env"

# Create a new tmux session with the registry env baked in.
# -d: detached
# -s: session name
tmux new-session -d -s "$SESSION" -c "$PWD" "${TMUX_ENV_ARGS[@]}"

# Also push to the session env so split-window panes (and any later shells
# in this session) inherit consistently.
for ((i = 0; i < ${#TMUX_ENV_ARGS[@]}; i += 2)); do
  # TMUX_ENV_ARGS[i] == "-e", TMUX_ENV_ARGS[i+1] == "KEY=VAL"
  tmux set-environment -t "$SESSION" "${TMUX_ENV_ARGS[i+1]%%=*}" "${TMUX_ENV_ARGS[i+1]#*=}"
done

# Register this session in the state file so stop-stack.sh knows what to kill.
# The state file is append-only; stop-stack.sh clears it after cleanup.
echo "$SESSION" >> "$STATE_FILE"

# Resolve the actual first-window index (respects user's base-index setting,
# which may be 0 or 1 depending on .tmux.conf).
WIN=$(tmux list-windows -t "$SESSION" -F '#{window_index}' | head -n1)

# Enable pane borders and show pane titles.
# Note: tmux doesn't have a true per-pane "top bar", but pane borders can display a title.
tmux set-option -t "$SESSION" pane-border-status top

tmux set-option -t "$SESSION" pane-border-format "#[fg=colour39,bold] #{pane_title} #[default]"

# Session-scoped status bar (no -g so it doesn't affect other sessions)
tmux set-option -t "$SESSION" status-position top

tmux set-option -t "$SESSION" status-style "bg=colour235,fg=colour250"

tmux set-option -t "$SESSION" status-left-length 80

# Show stack id + key ports so it's obvious which stack you're attached to.
tmux set-option -t "$SESSION" status-left \
  "#[fg=colour39,bold]$SESSION #[fg=colour244]gw:$GATEWAY_API_PORT ui:$UI_PORT pg:$POSTGRES_HOST_PORT #[default]"

tmux set-option -t "$SESSION" status-right-length 120

tmux set-option -t "$SESSION" status-right "#[fg=colour244]%Y-%m-%d %H:%M:%S#[default]"

# Split the first pane horizontally (left-right split)
tmux split-window -h -t "$SESSION":$WIN

# Split the first pane vertically (top-bottom split)
tmux split-window -v -t "$SESSION":$WIN.0

# Split the right pane vertically (to add bootstrap)
tmux split-window -v -t "$SESSION":$WIN.2

# Name panes for window 0 (core stack)
tmux select-pane -t "$SESSION":$WIN.0 -T "$GATEWAY_TITLE"
tmux select-pane -t "$SESSION":$WIN.1 -T "$CORE_TITLE"
tmux select-pane -t "$SESSION":$WIN.2 -T "UI"
tmux select-pane -t "$SESSION":$WIN.3 -T "BOOTSTRAP"
tmux send-keys -t "$SESSION":$WIN.0 "$GATEWAY_CMD" C-m
tmux send-keys -t "$SESSION":$WIN.1 "$CORE_CMD" C-m

# Pane 3: Setup and run UI (PORT must be set per-pane so it doesn't leak)
tmux send-keys -t "$SESSION":$WIN.2 'builtin cd app/ui' C-m
tmux send-keys -t "$SESSION":$WIN.2 'pnpm install' C-m
tmux send-keys -t "$SESSION":$WIN.2 "PORT=$UI_PANE_PORT pnpm run dev" C-m

# Pane 4: Run bootstrap service in DEV_API mode
tmux send-keys -t "$SESSION":$WIN.3 'builtin cd app/bootstrap' C-m
tmux send-keys -t "$SESSION":$WIN.3 "$BOOTSTRAP_ENV ENABLE_DEV_API=true USER=postgres go run cmd/main.go" C-m

# Create dedicated window for payment + notification.
tmux new-window -t "$SESSION" -n "payment/notification" -c "$PWD"
WIN_EXT=$(tmux list-windows -t "$SESSION" -F '#{window_index} #{window_name}' | awk '$2=="payment/notification"{print $1; exit}')

# pane-border-status / pane-border-format are window-scoped, so the session-wide
# set above only applied to the first window. Re-apply here.
tmux set-window-option -t "$SESSION":$WIN_EXT pane-border-status top
tmux set-window-option -t "$SESSION":$WIN_EXT pane-border-format "#[fg=colour39,bold] #{pane_title} #[default]"

if $NOTIFICATION_ENABLED; then
  tmux split-window -v -t "$SESSION":$WIN_EXT.0
fi

tmux select-pane -t "$SESSION":$WIN_EXT.0 -T "$PAYMENT_TITLE"
tmux send-keys -t "$SESSION":$WIN_EXT.0 'builtin cd app/payment' C-m
tmux send-keys -t "$SESSION":$WIN_EXT.0 "$PAYMENT_CMD" C-m

if $NOTIFICATION_ENABLED; then
  tmux select-pane -t "$SESSION":$WIN_EXT.1 -T "$NOTIFICATION_TITLE"
  tmux send-keys -t "$SESSION":$WIN_EXT.1 'builtin cd app/notification' C-m
  tmux send-keys -t "$SESSION":$WIN_EXT.1 "$NOTIFICATION_CMD" C-m

  # core-event WAL consumer (shares the payment/notification window)
  tmux split-window -v -t "$SESSION":$WIN_EXT.1
  tmux select-pane -t "$SESSION":$WIN_EXT.2 -T "$CORE_EVENT_TITLE"
  tmux send-keys -t "$SESSION":$WIN_EXT.2 'builtin cd app/core-event' C-m
  tmux send-keys -t "$SESSION":$WIN_EXT.2 "$CORE_EVENT_CMD" C-m
else
  echo "[run-stack] notification ports are missing in stack registry; notification service will not be started." >&2
fi

# Focus the primary stack window/pane by default.
tmux select-window -t "$SESSION":$WIN
tmux select-pane -t "$SESSION":$WIN.0

echo
echo "[run-stack] stack '$STACK_ID' up — gateway:$GATEWAY_API_PORT ui:$UI_PORT postgres:$POSTGRES_HOST_PORT"
echo "[run-stack] grafana: http://localhost:$GRAFANA_HOST_PORT (admin/admin) — otlp http: $OTEL_HTTP_HOST_PORT"
echo "[run-stack] tmux session: $SESSION"
echo

# Attach to the session (or switch to it if we're already inside tmux,
# since tmux sessions can't be nested).
if [ -n "${TMUX:-}" ]; then
  tmux switch-client -t "$SESSION"
else
  tmux attach-session -t "$SESSION"
fi
