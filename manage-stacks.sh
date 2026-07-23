#!/usr/bin/env bash
# Interactive browser for utro stacks across all worktrees.
#
# Reads ~/.utro-stacks/<id>/stack.env entries (one per worktree that ever
# ran ./run-stack.sh) and lets you stop, purge, or attach to any of them
# from a single keyboard-driven menu.
#
# Keys:
#   ↑ / ↓ / k / j   move selection
#   s               stop the selected stack (stop-stack.sh from its worktree)
#   p               purge — stop + compose down + delete registry entry
#   a               attach to its tmux session
#   o               sweep orphaned nx dev procs not under any registered worktree
#   r               refresh
#   q / Esc         quit

set -uo pipefail

: "${UTRO_STACKS_HOME:=$HOME/.utro-stacks}"

declare -a IDS WORKTREES SESSIONS GATEWAY_PORTS UI_PORTS PG_PORTS COMPOSE_PROJECTS SESSION_STATES TMUX_DETAILS

load_stacks() {
  IDS=(); WORKTREES=(); SESSIONS=(); GATEWAY_PORTS=(); UI_PORTS=(); PG_PORTS=()
  COMPOSE_PROJECTS=(); SESSION_STATES=(); TMUX_DETAILS=()
  [ -d "$UTRO_STACKS_HOME" ] || return 0
  local dir
  shopt -s nullglob
  for dir in "$UTRO_STACKS_HOME"/*/; do
    local id env_file
    id=$(basename "$dir")
    env_file="$dir/stack.env"
    [ -f "$env_file" ] || continue
    (
      # shellcheck disable=SC1090
      . "$env_file"
      printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
        "$id" \
        "${STACK_WORKTREE:-?}" \
        "${STACK_TMUX_SESSION:-?}" \
        "${GATEWAY_API_PORT:-?}" \
        "${UI_PORT:-?}" \
        "${POSTGRES_HOST_PORT:-?}" \
        "${COMPOSE_PROJECT_NAME:-?}"
    )
  done | sort | while IFS=$'\t' read -r id worktree session gw ui pg compose; do
    printf '%s\n%s\n%s\n%s\n%s\n%s\n%s\n' "$id" "$worktree" "$session" "$gw" "$ui" "$pg" "$compose"
  done > /tmp/.utro-stacks-load.$$ || true
  # Pull rows of 7 lines each back into parallel arrays.
  if [ -s /tmp/.utro-stacks-load.$$ ]; then
    local line cnt=0
    local -a row=()
    while IFS= read -r line; do
      row+=("$line"); cnt=$((cnt+1))
      if [ "$cnt" -eq 7 ]; then
        IDS+=("${row[0]}")
        WORKTREES+=("${row[1]}")
        SESSIONS+=("${row[2]}")
        GATEWAY_PORTS+=("${row[3]}")
        UI_PORTS+=("${row[4]}")
        PG_PORTS+=("${row[5]}")
        COMPOSE_PROJECTS+=("${row[6]}")
        local state="down" detail=""
        if tmux has-session -t "=${row[2]}" 2>/dev/null; then
          state="up"
          detail=$(tmux list-panes -s -t "${row[2]}" -F '#{pane_current_command}' 2>/dev/null \
                   | sort -u | tr '\n' ',' | sed 's/,$//')
        fi
        SESSION_STATES+=("$state")
        TMUX_DETAILS+=("$detail")
        cnt=0; row=()
      fi
    done < /tmp/.utro-stacks-load.$$
  fi
  rm -f /tmp/.utro-stacks-load.$$
}

# ── Drawing ───────────────────────────────────────────────────────────────

SAVED_STTY=""
enter_raw_mode() {
  if [ -t 0 ]; then
    SAVED_STTY=$(stty -g 2>/dev/null || true)
    stty -icanon -echo min 1 time 0 2>/dev/null || true
  fi
}
cleanup() {
  printf '\033[?25h'  # show cursor
  if [ -n "$SAVED_STTY" ]; then
    stty "$SAVED_STTY" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

draw() {
  local sel=$1
  printf '\033[2J\033[H'  # clear + home
  printf '\033[1mUtro stacks\033[0m  '
  printf '\033[2m(%s)\033[0m\n' "$UTRO_STACKS_HOME"
  printf '\033[2m↑/↓ navigate · s stop · p purge · a attach · o orphans · r refresh · q quit\033[0m\n\n'

  if [ ${#IDS[@]} -eq 0 ]; then
    printf '  (no stacks registered)\n'
    return
  fi

  printf '    %-9s %-6s %-8s %-8s %-8s %s\n' 'ID' 'TMUX' 'GATEWAY' 'UI' 'POSTGRES' 'WORKTREE'
  printf '    %s\n' '─────────────────────────────────────────────────────────────────────────'
  local i state state_color line
  for i in "${!IDS[@]}"; do
    case "${SESSION_STATES[$i]}" in
      up)   state_color='\033[32m' ;;
      down) state_color='\033[90m' ;;
      *)    state_color='' ;;
    esac
    if [ "$i" -eq "$sel" ]; then
      printf '\033[7m  ▸ '
    else
      printf '    '
    fi
    printf '%-9s ' "${IDS[$i]}"
    printf "${state_color}%-6s\033[0m" "${SESSION_STATES[$i]}"
    if [ "$i" -eq "$sel" ]; then printf '\033[7m'; fi
    printf ' %-8s %-8s %-8s %s' \
      "${GATEWAY_PORTS[$i]}" "${UI_PORTS[$i]}" "${PG_PORTS[$i]}" "${WORKTREES[$i]}"
    printf '\033[0m\n'
  done
}

# ── Input ─────────────────────────────────────────────────────────────────

read_key() {
  local k1 k2 k3
  IFS= read -rsn1 k1 || return 1
  if [ "$k1" = $'\e' ]; then
    # Could be a bare Esc or an arrow sequence. Two forms:
    #   \e[A/B/C/D — normal cursor mode
    #   \eOA/B/C/D — application cursor mode (some terminals)
    # macOS bash 3.2 only supports integer -t; arrow bytes are already
    # buffered in the same keystroke so the timeout never actually fires.
    IFS= read -rsn1 -t 1 k2 || { printf 'esc'; return 0; }
    case "$k2" in
      '['|'O') ;;
      *) printf 'esc'; return 0 ;;
    esac
    IFS= read -rsn1 -t 1 k3 || k3=''
    case "$k3" in
      A) printf 'up' ;;
      B) printf 'down' ;;
      C) printf 'right' ;;
      D) printf 'left' ;;
      *) printf 'esc' ;;
    esac
    return 0
  fi
  printf '%s' "$k1"
}

# ── Actions ───────────────────────────────────────────────────────────────

prompt_yes_no() {
  local msg=$1 yn rc
  printf '\n%s ' "$msg"
  cleanup  # cooked mode for line read
  IFS= read -r yn
  rc=0
  [[ "$yn" =~ ^[Yy] ]] || rc=1
  enter_raw_mode
  return $rc
}

stop_stack() {
  local idx=$1 purge=$2
  local worktree="${WORKTREES[$idx]}"
  local id="${IDS[$idx]}"
  local args=()
  $purge && args+=(--purge)
  cleanup  # restore terminal so the script's output is readable
  if [ -d "$worktree" ] && [ -x "$worktree/stop-stack.sh" ]; then
    printf '\n→ Running stop-stack.sh in %s\n' "$worktree"
    ( cd "$worktree" && ./stop-stack.sh "${args[@]}" )
  else
    printf '\n⚠ Worktree gone (%s) — falling back to direct cleanup\n' "$worktree"
    local sess="${SESSIONS[$idx]}"
    tmux kill-session -t "=$sess" 2>/dev/null && printf '  killed tmux session %s\n' "$sess"
    local port
    for port in "${GATEWAY_PORTS[$idx]}" "${UI_PORTS[$idx]}"; do
      [ "$port" = '?' ] && continue
      local pids
      pids=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)
      if [ -n "$pids" ]; then
        echo "$pids" | xargs -I{} kill -TERM {} 2>/dev/null || true
        printf '  SIGTERM on port %s (%s)\n' "$port" "$pids"
      fi
    done
    if $purge; then
      if [ -n "${COMPOSE_PROJECTS[$idx]}" ] && [ "${COMPOSE_PROJECTS[$idx]}" != '?' ]; then
        printf '  docker-compose down (%s)\n' "${COMPOSE_PROJECTS[$idx]}"
        COMPOSE_PROJECT_NAME="${COMPOSE_PROJECTS[$idx]}" docker-compose down >/dev/null 2>&1 || true
      fi
      rm -rf "$UTRO_STACKS_HOME/$id" && printf '  removed registry entry %s\n' "$id"
    fi
  fi
  printf '\n(any key to continue) '
  enter_raw_mode
  IFS= read -rsn1 _
}

sweep_orphans() {
  cleanup
  printf '\n→ Scanning for orphaned nx dev procs (cwd not under any registered worktree)\n'

  local pids
  pids=$(pgrep -f 'nx\.js run [a-z]+:dev' 2>/dev/null || true)
  if [ -z "$pids" ]; then
    printf '  none found\n\n(any key) '
    IFS= read -rsn1 _
    enter_raw_mode
    return
  fi

  local orphan_pids=() orphan_lines=()
  for pid in $pids; do
    local cwd
    cwd=$(lsof -a -d cwd -p "$pid" -Fn 2>/dev/null | awk '/^n/ {sub(/^n/,""); print; exit}')
    local owned=false
    if [ -n "$cwd" ]; then
      local wt
      for wt in "${WORKTREES[@]+"${WORKTREES[@]}"}"; do
        case "$cwd" in
          "$wt"|"$wt"/*) owned=true; break ;;
        esac
      done
    fi
    if ! $owned; then
      orphan_pids+=("$pid")
      orphan_lines+=("$(printf '  %-6s cwd=%s' "$pid" "${cwd:-<unknown>}")")
    fi
  done

  if [ "${#orphan_pids[@]}" -eq 0 ]; then
    printf '  none found (all nx procs belong to registered worktrees)\n\n(any key) '
    IFS= read -rsn1 _
    enter_raw_mode
    return
  fi

  printf '\nOrphans:\n'
  local ln
  for ln in "${orphan_lines[@]}"; do printf '%s\n' "$ln"; done

  printf '\nSIGKILL all %d? [y/N] ' "${#orphan_pids[@]}"
  local yn
  IFS= read -r yn
  if [[ "$yn" =~ ^[Yy] ]]; then
    kill -KILL "${orphan_pids[@]}" 2>/dev/null || true
    printf '  killed %d procs\n' "${#orphan_pids[@]}"
  else
    printf '  skipped\n'
  fi
  printf '\n(any key) '
  enter_raw_mode
  IFS= read -rsn1 _
}

attach_tmux() {
  local idx=$1
  local sess="${SESSIONS[$idx]}"
  if ! tmux has-session -t "=$sess" 2>/dev/null; then
    printf '\n⚠ No tmux session for this stack. (any key) '
    IFS= read -rsn1 _
    return
  fi
  cleanup
  if [ -n "${TMUX:-}" ]; then
    tmux switch-client -t "$sess"
    # Coming back here means the user detached or switched again — stay in the menu.
  else
    tmux attach -t "$sess"
  fi
  enter_raw_mode
}

# ── Main loop ─────────────────────────────────────────────────────────────

main() {
  enter_raw_mode
  printf '\033[?25l'  # hide cursor
  local sel=0
  load_stacks
  while true; do
    if [ "${#IDS[@]}" -gt 0 ] && [ "$sel" -ge "${#IDS[@]}" ]; then
      sel=$(( ${#IDS[@]} - 1 ))
    fi
    [ "$sel" -lt 0 ] && sel=0
    draw "$sel"
    local key
    key=$(read_key) || break
    case "$key" in
      up|k)    ((sel > 0)) && ((sel--)) || true ;;
      down|j)  [ "${#IDS[@]}" -gt 0 ] && ((sel < ${#IDS[@]} - 1)) && ((sel++)) || true ;;
      s|S)
        if [ ${#IDS[@]} -gt 0 ]; then
          if prompt_yes_no "Stop ${IDS[$sel]} (${WORKTREES[$sel]})? [y/N]"; then
            stop_stack "$sel" false
            load_stacks
          fi
        fi
        ;;
      p|P)
        if [ ${#IDS[@]} -gt 0 ]; then
          if prompt_yes_no "PURGE ${IDS[$sel]} (compose down + drop registry) — confirm? [y/N]"; then
            stop_stack "$sel" true
            load_stacks
          fi
        fi
        ;;
      a|A) [ ${#IDS[@]} -gt 0 ] && attach_tmux "$sel" ;;
      o|O) sweep_orphans ;;
      r|R) load_stacks ;;
      q|Q|esc) break ;;
    esac
  done
  printf '\033[2J\033[H'
}

main "$@"
