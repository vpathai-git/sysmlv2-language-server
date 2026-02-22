# Contributing to SysML v2 Language Server

Thank you for your interest in contributing to this project. This document provides guidelines for contributing to the SysML v2 Language Server and VS Code extension.

## How to Report Bugs

Please report bugs by opening an issue at [GitHub Issues](https://github.com/vpathai-git/sysmlv2-language-server/issues). Include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Your environment (OS, Node.js version, VS Code version)
- Relevant log output or error messages

## How to Suggest Enhancements

Enhancement suggestions are also tracked via [GitHub Issues](https://github.com/vpathai-git/sysmlv2-language-server/issues). When suggesting an enhancement, please describe:

- The use case or problem the enhancement would address
- Your proposed solution or approach
- Any alternatives you have considered

## Contributor License Agreement (CLA)

All contributors must sign our [Contributor License Agreement](.github/CLA.md) before their pull requests can be merged. The CLA bot will automatically prompt you when you open your first PR. To sign, simply add a comment:

> I have read the CLA Document and I hereby sign the CLA.

The CLA ensures that the dual-license structure of this project is preserved. See the License Structure section below for details.

## Pull Request Workflow

1. Fork the repository
2. Create a feature branch from `main` (e.g., `feat/my-feature` or `fix/my-bugfix`)
3. Make your changes
4. Ensure the project builds successfully
5. Sign the CLA (if this is your first contribution)
6. Submit a pull request targeting the `main` branch

Keep pull requests focused on a single change. Provide a clear description of what the PR does and why.

## Development Setup

### Prerequisites

- Node.js 20 or later
- npm

### Getting Started

```bash
# Clone your fork
git clone https://github.com/<your-username>/sysmlv2-language-server.git
cd sysmlv2-language-server

# Install root dependencies
npm install

# Build the project
npm run build
```

## Code Style

- Write TypeScript following the patterns and conventions already established in the codebase
- No trailing whitespace
- Use clear, descriptive names for variables, functions, and types

## PR Checklist

Before submitting a PR, ensure:

- [ ] `npm run build` succeeds
- [ ] No new dependencies with copyleft licenses (GPL, LGPL, AGPL)

## Adding Validation Rules

1. Reference the relevant SysML v2 specification section
2. Follow the naming convention in `validation-codes.ts`
3. Add corresponding validation logic

## Adding Grammar Rules

1. Edit grammar files in `src/packages/grammar/src/`
2. Run `npx langium generate` to regenerate parser
3. Never edit files in `src/packages/grammar/src/generated/`

## Dependency Licenses

All new dependencies MUST use permissive licenses:
- **Allowed:** MIT, Apache 2.0, BSD, ISC
- **Prohibited:** GPL, LGPL, AGPL, or any copyleft license

## License Structure

This project uses a dual-license model. When contributing, be aware of which package your changes target:

| Package | License | Contains |
|---------|---------|----------|
| `@sysml/grammar` | LGPL-3.0-or-later | SysML/KerML grammar definitions |
| `@sysml/language-server` | LGPL-3.0-or-later | LSP server with validation rules |
| `@sysml/core` | MIT | Tree-Graph model engine (original) |
| `@sysml/shim` | MIT | EMF compatibility layer (original) |

**Important rules:**
- Contributions to MIT-licensed packages (`@sysml/core`, `@sysml/shim`) will be MIT-licensed
- Contributions to LGPL-licensed packages will be LGPL-licensed
- Each MIT-licensed source file carries an SPDX header: `// SPDX-License-Identifier: MIT`

By submitting a contribution, you agree to the terms of the [Contributor License Agreement](.github/CLA.md).
