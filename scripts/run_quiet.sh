#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}" )" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -f "$REPO_ROOT/.env" ]]; then
  # shellcheck disable=SC1090
  source "$REPO_ROOT/.env"
fi

DEFAULT_LOG_DIR="$REPO_ROOT/logs"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

if [[ -n ${QUIET_BUILD_LOG:-} ]]; then
  if [[ "$QUIET_BUILD_LOG" = /* ]]; then
    LOG_FILE="$QUIET_BUILD_LOG"
  else
    LOG_FILE="$REPO_ROOT/$QUIET_BUILD_LOG"
  fi
else
  LOG_FILE="$DEFAULT_LOG_DIR/build-$TIMESTAMP.log"
fi

mkdir -p "$(dirname "$LOG_FILE")"

summary() {
  printf '[quiet-build] %s\n' "$1"
}

fail() {
  summary "Error: $1"
  summary "See log: $LOG_FILE"
  exit 1
}

run_step() {
  local name="$1"
  shift
  local cmd_display="$*"
  summary "Starting $name"
  {
    printf '==== %s - %s ====\n' "$name" "$(date '+%F %T')"
    printf 'Command: %s\n\n' "$cmd_display"
    "$@"
    printf '\n==== %s done ====\n' "$name"
  } >>"$LOG_FILE" 2>&1 || fail "$name failed"
  summary "$name complete"
}

summary "Logging to $LOG_FILE"

pushd "$REPO_ROOT" >/dev/null

run_step install npm install
run_step build npm run build
run_step package npx vsce package

VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -n1 || true)
if [[ -z "$VSIX_FILE" ]]; then
  fail "VSIX file not found"
fi

CODE_CLI=""
if command -v code >/dev/null 2>&1; then
  CODE_CLI="$(command -v code)"
elif [[ -x "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" ]]; then
  CODE_CLI="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
fi

if [[ -n "$CODE_CLI" ]]; then
  run_step install_vsix "$CODE_CLI" --install-extension "$VSIX_FILE" --force
  summary "Installed $VSIX_FILE"
else
  summary "VS Code CLI not found; skipped install"
fi

popd >/dev/null

summary "VSIX ready: $VSIX_FILE"
summary "All steps finished"
summary "Log file: $LOG_FILE"
