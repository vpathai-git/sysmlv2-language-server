# @sysml/language-server

SysML v2 Language Server Protocol (LSP) implementation.

Can be used **independently** with any LSP-compatible editor (VS Code, Vim, Emacs, etc.)

## Features

✅ **Syntax validation** - Real-time parse error detection
✅ **Semantic validation** - Type checking, reference validation
✅ **Auto-completion** - Intelligent code completion
✅ **Go to definition** - Navigate to symbol definitions
✅ **Find references** - Find all symbol usages
✅ **Rename symbol** - Refactor symbol names
✅ **Document symbols** - Outline view of model structure
✅ **Hover information** - Type and documentation on hover
✅ **Diagnostics** - Error and warning reporting

## Installation

```bash
npm install @sysml/language-server
```

Or install globally for CLI usage:

```bash
npm install -g @sysml/language-server
```

## Standalone Usage (CLI)

### Start Language Server

The language server can run standalone without VS Code:

```bash
# Using npx
npx @sysml/language-server --stdio

# Or if installed globally
sysml-language-server --stdio

# Or using node directly
node node_modules/@sysml/language-server/bin/sysml-language-server.js --stdio
```

The `--stdio` flag uses standard input/output for LSP communication.

## Integration with Editors

### Vim/Neovim (with coc.nvim)

Add to your `~/.config/nvim/coc-settings.json`:

```json
{
  "languageserver": {
    "sysml": {
      "command": "sysml-language-server",
      "args": ["--stdio"],
      "filetypes": ["sysml"],
      "rootPatterns": [".git", "package.json"]
    }
  }
}
```

### Vim/Neovim (with vim-lsp)

Add to your `.vimrc` or `init.vim`:

```vim
if executable('sysml-language-server')
  au User lsp_setup call lsp#register_server({
    \ 'name': 'sysml-ls',
    \ 'cmd': {server_info->['sysml-language-server', '--stdio']},
    \ 'whitelist': ['sysml'],
    \ })
endif
```

### Neovim (with nvim-lspconfig)

Add to your `init.lua`:

```lua
local lspconfig = require('lspconfig')
local configs = require('lspconfig.configs')

-- Define SysML language server
if not configs.sysml then
  configs.sysml = {
    default_config = {
      cmd = {'sysml-language-server', '--stdio'},
      filetypes = {'sysml'},
      root_dir = lspconfig.util.root_pattern('.git', 'package.json'),
      settings = {},
    },
  }
end

-- Setup SysML language server
lspconfig.sysml.setup{}
```

### Emacs (with lsp-mode)

Add to your `~/.emacs.d/init.el`:

```elisp
(require 'lsp-mode)

;; Register SysML language server
(add-to-list 'lsp-language-id-configuration '(sysml-mode . "sysml"))

(lsp-register-client
 (make-lsp-client :new-connection (lsp-stdio-connection "sysml-language-server")
                  :major-modes '(sysml-mode)
                  :server-id 'sysml-ls))

;; Auto-start LSP for .sysml files
(add-hook 'sysml-mode-hook #'lsp)
```

### Sublime Text (with LSP package)

Add to your LSP settings (`Preferences > Package Settings > LSP > Settings`):

```json
{
  "clients": {
    "sysml": {
      "enabled": true,
      "command": ["sysml-language-server", "--stdio"],
      "selector": "source.sysml"
    }
  }
}
```

## Programmatic Usage

### Basic Parsing and Validation

```typescript
import { createSysMLServices } from '@sysml/language-server';
import { NodeFileSystem } from 'langium/node';

// Create services
const { shared, SysML } = createSysMLServices({ ...NodeFileSystem });

// Parse and validate a document
const document = shared.workspace.LangiumDocumentFactory.fromString(
  `package MySystem {
    part vehicle : Vehicle;
  }`,
  'file:///test.sysml'
);

// Build document (triggers parsing and validation)
await shared.workspace.DocumentBuilder.build([document]);

// Check for errors
if (document.diagnostics && document.diagnostics.length > 0) {
  console.log('Errors:', document.diagnostics);
} else {
  console.log('✅ No errors');
}
```

### Working with Workspace

```typescript
import { createSysMLServices } from '@sysml/language-server';
import { NodeFileSystem } from 'langium/node';
import { URI } from 'vscode-uri';

const services = createSysMLServices({ ...NodeFileSystem });

// Load multiple documents
const doc1 = services.shared.workspace.LangiumDocumentFactory.fromString(
  'package Base { part def Vehicle; }',
  URI.file('/models/base.sysml')
);

const doc2 = services.shared.workspace.LangiumDocumentFactory.fromString(
  'package App { import Base::*; part myVehicle : Vehicle; }',
  URI.file('/models/app.sysml')
);

// Build all documents (resolves cross-references)
await services.shared.workspace.DocumentBuilder.build([doc1, doc2]);

// Access AST
const ast = doc2.parseResult.value;
console.log('AST:', ast);
```

### Custom Validation

```typescript
import { createSysMLServices } from '@sysml/language-server';
import { ValidationAcceptor, ValidationChecks } from 'langium';
import type { PartDefinition } from '@sysml/grammar';

const services = createSysMLServices({ ...NodeFileSystem });

// Add custom validation rule
const customChecks: ValidationChecks<any> = {
  PartDefinition: (partDef: PartDefinition, accept: ValidationAcceptor) => {
    if (partDef.name && partDef.name.length < 3) {
      accept('warning', 'Part name should be at least 3 characters', {
        node: partDef,
        property: 'name'
      });
    }
  }
};

// Register custom checks
services.SysML.validation.ValidationRegistry.register(customChecks);
```

## CLI Tools

### Validate SysML Files

Create a validation script:

```typescript
#!/usr/bin/env node
import { createSysMLServices } from '@sysml/language-server';
import { NodeFileSystem } from 'langium/node';
import { URI } from 'vscode-uri';
import * as fs from 'fs';
import * as path from 'path';

const services = createSysMLServices({ ...NodeFileSystem });

async function validateFile(filePath: string) {
  const source = fs.readFileSync(filePath, 'utf-8');
  const document = services.shared.workspace.LangiumDocumentFactory.fromString(
    source,
    URI.file(filePath)
  );

  await services.shared.workspace.DocumentBuilder.build([document]);

  if (document.diagnostics && document.diagnostics.length > 0) {
    console.error(`❌ ${filePath}:`);
    for (const diag of document.diagnostics) {
      const severity = diag.severity === 1 ? 'ERROR' : 'WARNING';
      console.error(`   ${severity} at line ${diag.range.start.line + 1}: ${diag.message}`);
    }
    return false;
  } else {
    console.log(`✅ ${filePath}`);
    return true;
  }
}

// Usage
const files = process.argv.slice(2);
Promise.all(files.map(validateFile)).then(results => {
  const allValid = results.every(r => r);
  process.exit(allValid ? 0 : 1);
});
```

Run it:
```bash
chmod +x validate-sysml.js
./validate-sysml.js model1.sysml model2.sysml
```

## Configuration

### Workspace Settings

The language server can be configured through workspace settings (when used with supported editors):

```json
{
  "sysml": {
    "validation": {
      "enabled": true
    },
    "completion": {
      "enabled": true
    },
    "trace": {
      "server": "verbose"
    }
  }
}
```

## Architecture

The language server is built on:

- **Langium** - Language framework
- **@sysml/grammar** - SysML v2 grammar and AST
- **@sysml/core** - Domain model engine
- **vscode-languageserver** - LSP protocol implementation

```
┌─────────────────────────────────┐
│   Language Server               │
│   - Validation                  │
│   - Completion                  │
│   - Navigation                  │
└────────┬────────────────────────┘
         │
    ┌────▼─────┐  ┌──────────────┐
    │  Grammar │  │     Core     │
    │   + AST  │  │  Tree-Graph  │
    └──────────┘  └──────────────┘
```

## Performance

- **Startup**: ~100ms
- **Parse**: ~5-10ms per file
- **Validation**: ~10-20ms per file
- **Memory**: ~50MB for typical workspace

## Troubleshooting

### Language server not starting

Check that it's installed:
```bash
which sysml-language-server
# or
npm list -g @sysml/language-server
```

### No diagnostics showing

Enable trace logging in your editor to see LSP communication:
```json
{
  "sysml.trace.server": "verbose"
}
```

### Cross-reference errors

Ensure all imported files are in the workspace:
- LSP needs access to all referenced files
- Check file paths and import statements

## Related Packages

- **[@sysml/grammar](../grammar)** - Parse-only (no LSP) for analysis tools
- **[@sysml/core](../core)** - Domain model engine
- **[vscode-extension](../vscode-extension)** - Pre-configured VS Code extension

## Comparison

| Use Case | Package |
|----------|---------|
| Parse-only | @sysml/grammar |
| IDE support | @sysml/language-server (this) |
| VS Code | vscode-extension |
| Domain model | @sysml/core |

## Examples

See the [examples directory](../../examples) for:
- Custom validators
- Code generators
- Model analyzers
- LSP clients

## Contributing

See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for contribution guidelines.

## License

LGPL-3.0-or-later

---

**Quick Start**: `npm install -g @sysml/language-server && sysml-language-server --stdio`
