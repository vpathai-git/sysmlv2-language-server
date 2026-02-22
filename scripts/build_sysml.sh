#!/usr/bin/env bash
set -euo pipefail

# Resolve repo root relative to this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SYSML_ROOT="${REPO_ROOT}/src"

echo "==> Building SysML v2 Language Server..."

cd "${SYSML_ROOT}"

# Install dependencies for the server workspace
echo "Installing SysML server dependencies..."
npm install

# Build the workspace
# This triggers the build scripts in grammar, core, and language-server
echo "Building SysML server packages..."
npm run build

# Verify build outputs (esbuild outputs directly to dist/language-server/)
DEST_DIR="${REPO_ROOT}/dist/language-server"

# Check for the bundled server (esbuild outputs main-node.bundle.js directly here)
BUNDLE="${DEST_DIR}/main-node.bundle.js"
if [[ -f "${BUNDLE}" ]]; then
    echo "Server bundle verified at ${BUNDLE}"
else
    echo "Error: Server bundle not found at ${BUNDLE}"
    exit 1
fi

# Check for stdlib (npm run build copies it directly here)
STDLIB="${DEST_DIR}/stdlib"
if [[ -d "${STDLIB}" ]]; then
    echo "Stdlib verified at ${STDLIB}"
else
    echo "Error: stdlib not found at ${STDLIB}"
    exit 1
fi

echo "SysML Server build complete."
