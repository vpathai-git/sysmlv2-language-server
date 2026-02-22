# SysML v2 Language Support

> by [VPATH AI](https://github.com/vpathai-git) — Digital Twin by Derivation

[![License: LGPL v3](https://img.shields.io/badge/License-LGPL_v3-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This project provides language support for SysML v2 in VS Code, including:
- Syntax Highlighting
- Validation (210+ rules)
- Language Server Protocol (LSP) support

## Quick Start

```bash
# Install dependencies
npm install

# Build the Language Server and Extension
npm run build

# Package the extension
npm run package
```

## Architecture

A fully spec-compliant SysML v2 language server built on [Langium](https://langium.org).

### Project Structure

```
sysmlv2-language-server/
├── src/                          # Source code
│   ├── packages/                 # Langium workspace packages
│   │   ├── grammar/              # SysML/KerML grammar definitions
│   │   ├── core/                 # Tree-Graph model engine (MIT)
│   │   └── language-server/      # LSP server implementation
│   └── extension/                # VS Code extension
│       └── shim/                 # EMF compatibility layer (MIT)
├── dist/                         # Build output
├── scripts/                      # Build helper scripts
└── sysml_resources/              # Syntax highlighting
```

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `scripts/build_sysml.sh` | Build the SysML language server |
| `scripts/build_and_install.sh` | Build everything and install VS Code extension |
| `scripts/run_quiet.sh` | Build with logging (quiet mode for CI) |

```bash
# Build the language server
./scripts/build_sysml.sh

# Full build + install extension
./scripts/build_and_install.sh
```

---

## Development Workflow

### Grammar Development

```bash
# After modifying sysml.langium or kerml.langium
cd src/packages/grammar
npx langium generate
```

### Extension Development

```bash
# Build and install
./scripts/build_and_install.sh

# Or step by step:
./scripts/build_sysml.sh
npm run build:production
npm run package
```

---

## Acknowledgments

This project builds on the work of the SysML v2 community:

- **[SysML v2 Pilot Implementation](https://github.com/Systems-Modeling/SysML-v2-Pilot-Implementation)** (LGPL-3.0-or-later) — The official OMG reference implementation. Our grammar definitions, standard library, and validation codes are derived from this project.
- **[SysIDE / sysml-2ls](https://github.com/sensmetry/sysml-2ls)** (EPL-2.0) by [Sensmetry](https://sensmetry.com) — A Langium-based SysML v2 language server that served as an architectural reference.
- **[Langium](https://langium.org)** (MIT) by Eclipse Foundation / TypeFox — The language engineering framework powering this implementation.

## License

This project uses a **dual-license** model:

| Package | License | Description |
|---------|---------|-------------|
| `@sysml/grammar` | LGPL-3.0-or-later | SysML/KerML grammar definitions |
| `@sysml/language-server` | LGPL-3.0-or-later | LSP server with validation rules |
| `@sysml/core` | **MIT** | Tree-Graph model engine (original work) |
| `@sysml/shim` | **MIT** | EMF compatibility layer (original work) |
| Root extension | LGPL-3.0-or-later | VS Code extension bundle |

The MIT-licensed packages (`@sysml/core`, `@sysml/shim`) are 100% original code by VPATHAI and may be freely used in commercial and closed-source projects.

See [LICENSES/](LICENSES/) for full license texts and [NOTICE](NOTICE) for attribution.

Copyright (c) 2025-2026 VPATHAI.
