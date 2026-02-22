#!/bin/bash
# Grammar Package Setup Script
# Run this after checkout to regenerate build artifacts
#
# Usage: ./scripts/setup.sh
#
# This script:
# 1. Installs npm dependencies
# 2. Generates Langium parser from grammar
# 3. Compiles TypeScript (if no errors)

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Grammar Package Setup ==="
echo "Package directory: $PACKAGE_DIR"
echo ""

cd "$PACKAGE_DIR"

# Step 1: Install dependencies
echo "[1/3] Installing npm dependencies..."
npm install

# Step 2: Generate Langium parser
echo ""
echo "[2/3] Generating Langium parser from sysml.langium..."
npx langium generate

# Step 3: Compile TypeScript
echo ""
echo "[3/3] Compiling TypeScript..."
if npm run build 2>&1; then
    echo ""
    echo "=== Setup Complete ==="
    echo "All build artifacts generated successfully."
else
    echo ""
    echo "=== Setup Partial ==="
    echo "Langium generation succeeded, but TypeScript compilation has errors."
    echo "This is expected - there are known circular type issues in the generated AST."
    echo ""
    echo "The grammar parser is still usable via the generated module."
    echo "See: backlog/1_language_server/REFLECT-001_GrammarComplexity.json (ISSUE-3)"
fi

echo ""
echo "Generated files:"
echo "  - src/generated/ast.ts      (AST type definitions)"
echo "  - src/generated/grammar.ts  (Parser grammar)"
echo "  - src/generated/module.ts   (Langium services)"
echo ""
echo "To test grammar: npx langium generate"
