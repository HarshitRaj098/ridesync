#!/bin/bash
# Expo tunnel watchdog for RideSync mobile (ridesync-mobile).
# Keeps https://uvzp8ii-anonymous-8081.exp.direct alive across VM restarts.
# - If the tunnel answers HTTP 200, do nothing.
# - If it does not, kill any stale Expo server and start a fresh one detached,
#   then wait up to ~150s for the tunnel to come back.
# Safe to run every few minutes; a lockfile prevents overlapping restarts.
# Exit codes: 0 = tunnel up (or recovered), 1 = tunnel still down after restart.
set -u
TUNNEL_URL="https://uvzp8ii-anonymous-8081.exp.direct/"
LOG_FILE="$HOME/workspace/ridesync/expo-tunnel-watchdog.log"
LOCK_FILE="/tmp/expo-watchdog.lock"
APP_DIR="$HOME/workspace/ridesync/ridesync-mobile"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S %Z') $*" >> "$LOG_FILE"; }

tunnel_up() {
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$TUNNEL_URL" 2>/dev/null || echo "000")
  [ "$code" = "200" ]
}

(
  flock -n 9 || { log "watchdog: another run is already active, skipping"; exit 0; }

  if tunnel_up; then
    log "watchdog: tunnel OK (200), nothing to do"
    exit 0
  fi
  log "watchdog: tunnel DOWN, restarting Expo server"

  # Kill any stale Expo dev server for this project (if present).
  pkill -f "expo/bin/cli start" 2>/dev/null || true
  sleep 2
  pkill -f "expo/bin/cli start" 2>/dev/null || true
  sleep 2

  # Start a fresh server detached so it outlives this script/cron run.
  cd "$APP_DIR" || { log "watchdog: cannot cd to $APP_DIR"; exit 1; }
  NODE_PATH="$HOME/.npm-global/lib/node_modules" setsid nohup node node_modules/expo/bin/cli start --tunnel --port 8081 >> /tmp/expo-start.log 2>&1 < /dev/null &
  log "watchdog: Expo server started (pid $!), waiting for tunnel"

  for i in $(seq 1 15); do
    sleep 10
    if tunnel_up; then
      log "watchdog: tunnel recovered (200) after ${i}0s"
      exit 0
    fi
  done
  log "watchdog: tunnel STILL DOWN after restart attempt (150s)"
  exit 1
) 9>"$LOCK_FILE"
