#!/usr/bin/env bash
set -euo pipefail

# Resolve repo root relative to this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

DEFAULT_CODE_BIN="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
CODE_BIN="${CODE_BIN:-$DEFAULT_CODE_BIN}"

if [[ ! -x "${CODE_BIN}" ]]; then
  echo "error: VS Code CLI not found at '${CODE_BIN}'." >&2
  echo "       Set CODE_BIN to your 'code' executable path and retry." >&2
  exit 1
fi

run_step() {
  echo "\n==> $1"
  shift
  "$@"
}

run_step "Building SysML Server" ./scripts/build_sysml.sh
run_step "Bumping extension version" node ./scripts/bump_version.mjs
run_step "Building extension and webview" npm run build:production
run_step "Packaging VSIX" npm run package

VSIX_FILE="$(ls -t vpath-sysml-agent-*.vsix 2>/dev/null | head -n 1 || true)"
if [[ -z "${VSIX_FILE}" ]]; then
  echo "error: no VSIX produced. Check npm run package output." >&2
  exit 1
fi

run_step "Installing ${VSIX_FILE}" "${CODE_BIN}" --install-extension "${VSIX_FILE}" --force

echo "\nAll done. Installed ${VSIX_FILE} using ${CODE_BIN}."
