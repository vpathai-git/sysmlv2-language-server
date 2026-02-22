# @sysml/grammar

Pure SysML v2 grammar and AST types - **no LSP dependencies**.

## Features

✅ **Standalone parsing** - Parse SysML without running a language server
✅ **Zero LSP dependencies** - Pure grammar and AST types
✅ **Langium-generated** - Reliable parser from formal grammar
✅ **TypeScript types** - Full type safety for AST manipulation

## Installation

```bash
npm install @sysml/grammar
```

## Usage

### Standalone Parsing (Recommended)

```typescript
import { parseSysML } from '@sysml/grammar';

const result = parseSysML(`
  package MySystem {
    part vehicle : Vehicle;
  }
`);

if (result.success) {
  console.log('AST:', result.ast);
  console.log('Package name:', result.ast.elements[0].name);
} else {
  console.error('Parse errors:', result.parserErrors);
}
```

### Working with AST

```typescript
import { parseSysML } from '@sysml/grammar';
import type { Package, PartUsage } from '@sysml/grammar';

const result = parseSysML(`
  package VehicleSystem {
    part def Vehicle {
      part engine : Engine;
      part wheels : Wheel [4];
    }
  }
`);

// Navigate AST
const pkg = result.ast.elements[0] as Package;
const partDef = pkg.body?.elements[0];

console.log('Package:', pkg.name);
console.log('Part definition:', partDef);
```

### Advanced: Direct Langium Services

For advanced use cases, you can create Langium services directly:

```typescript
import { createDefaultModule, createDefaultSharedModule, EmptyFileSystem } from 'langium';
import { inject } from 'langium';
import { SysMLGeneratedModule, SysMLGeneratedSharedModule } from '@sysml/grammar';

// Create minimal services
const shared = inject(
  createDefaultSharedModule(EmptyFileSystem),
  SysMLGeneratedSharedModule
);

const sysml = inject(
  createDefaultModule({ shared }),
  SysMLGeneratedModule
);

// Use services for custom parsing logic
const document = shared.workspace.LangiumDocumentFactory.fromString(
  'package Test {}',
  'memory://test.sysml'
);
```

## API Reference

### parseSysML(source, uri?)

Parse SysML source code.

**Parameters**:
- `source: string` - SysML source code
- `uri?: string` - Optional document URI (default: 'memory://model.sysml')

**Returns**: `ParseResult`

```typescript
interface ParseResult {
  ast: Model;                  // Parsed AST
  parserErrors: ParseError[];  // Syntax errors
  lexerErrors: ParseError[];   // Tokenization errors
  success: boolean;            // Whether parsing succeeded
}

interface ParseError {
  message: string;
  line: number;
  column: number;
  offset: number;
  length: number;
}
```

### disposeParser()

Free parser resources. Call when done parsing to release memory.

```typescript
import { parseSysML, disposeParser } from '@sysml/grammar';

// Parse many files
for (const file of files) {
  const result = parseSysML(file.content);
  // ... process result
}

// Cleanup when done
disposeParser();
```

## AST Types

All AST types are exported and fully typed:

```typescript
import type {
  Model,
  Package,
  PartDefinition,
  PartUsage,
  AttributeDefinition,
  AttributeUsage,
  ActionDefinition,
  ActionUsage,
  StateDefinition,
  StateUsage,
  Requirement,
  // ... and many more
} from '@sysml/grammar';
```

### Type Hierarchy

The AST follows the SysML v2.0 specification:

- **Definitions**: `PartDefinition`, `AttributeDefinition`, `ActionDefinition`, etc.
- **Usages**: `PartUsage`, `AttributeUsage`, `ActionUsage`, etc.
- **Relationships**: `Specialization`, `Subsetting`, `Redefinition`, `Crosses`, etc.
- **Expressions**: `FeatureReferenceExpression`, `OwnedFeatureChain`, etc.

## Use Cases

### ✅ Parse SysML Files

```typescript
import { parseSysML } from '@sysml/grammar';
import * as fs from 'fs';

const source = fs.readFileSync('model.sysml', 'utf-8');
const result = parseSysML(source, 'file:///model.sysml');

if (!result.success) {
  for (const error of result.parserErrors) {
    console.error(`Error at line ${error.line}: ${error.message}`);
  }
  process.exit(1);
}
```

### ✅ Analyze AST

```typescript
import { parseSysML } from '@sysml/grammar';
import type { PartDefinition } from '@sysml/grammar';

const result = parseSysML(source);

// Find all part definitions
function findPartDefinitions(elements: any[]): PartDefinition[] {
  const parts: PartDefinition[] = [];
  for (const el of elements) {
    if (el.$type === 'PartDefinition') {
      parts.push(el as PartDefinition);
    }
    if (el.body?.elements) {
      parts.push(...findPartDefinitions(el.body.elements));
    }
  }
  return parts;
}

const partDefs = findPartDefinitions(result.ast.elements);
console.log(`Found ${partDefs.length} part definitions`);
```

### ✅ Validate Syntax in CI/CD

```typescript
import { parseSysML } from '@sysml/grammar';
import { glob } from 'glob';

async function validateAllModels() {
  const files = await glob('**/*.sysml');
  let hasErrors = false;

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf-8');
    const result = parseSysML(source, `file:///${file}`);

    if (!result.success) {
      console.error(`❌ ${file}:`);
      for (const error of result.parserErrors) {
        console.error(`   Line ${error.line}: ${error.message}`);
      }
      hasErrors = true;
    } else {
      console.log(`✅ ${file}`);
    }
  }

  if (hasErrors) {
    process.exit(1);
  }
}

validateAllModels();
```

### ✅ Build Custom Tooling

```typescript
import { parseSysML } from '@sysml/grammar';

// Code generator
function generateCode(model: Model): string {
  // ... generate code from AST
}

// Model transformer
function transformModel(model: Model): Model {
  // ... transform AST
}

// Static analyzer
function analyzeModel(model: Model): Report {
  // ... analyze model for patterns, issues, etc.
}
```

## Grammar Variants

This package provides multiple grammar variants:

- **sysml.langium** - Pragmatic variant (developer-friendly with extensions)
- **sysml-spec-compliant.langium** - 100% OMG spec compliant
- **sysml-extended.langium** - Extended features
- **sysml-comprehensive.langium** - Full feature set

By default, the pragmatic variant is used. See [DEVIATIONS.md](../../DEVIATIONS.md) for details on differences.

## Comparison with Other Packages

| Package | Use Case | Dependencies |
|---------|----------|--------------|
| **@sysml/grammar** | Parse-only, analysis tools, CI/CD | Langium only |
| **@sysml/language-server** | IDE features, validation, LSP | Langium + LSP + this |
| **@sysml/core** | Domain model, tree-graph | Langium + this |

## Performance

The parser uses a singleton pattern for efficiency:

- First parse: ~50ms (service initialization)
- Subsequent parses: ~5-10ms per file
- Memory: ~20MB for parser services

For parsing many files, the singleton instance is reused automatically.

## Troubleshooting

### "Cannot find module '@sysml/grammar'"

Make sure you've built the package:
```bash
cd packages/grammar
pnpm build
```

### Parse errors on valid SysML

Check which grammar variant you need:
- Pragmatic (default): Supports extensions like optional semicolons
- Spec-compliant: Strict OMG specification adherence

### Type errors with AST

Ensure TypeScript can find the generated types:
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "types": ["@sysml/grammar"]
  }
}
```

## Related Packages

- **[@sysml/language-server](../language-server)** - Full LSP implementation for IDE support
- **[@sysml/core](../core)** - Domain model engine with tree-graph architecture
- **[vscode-extension](../vscode-extension)** - VS Code extension

## Contributing

See [IMPLEMENTATION_SUMMARY.md](../../IMPLEMENTATION_SUMMARY.md) for architecture details.

## License

LGPL-3.0-or-later

## Version

Current version: 0.2.0

Changes in v0.2.0:
- ✅ Removed LSP dependency (pure grammar package)
- ✅ Added standalone `parseSysML()` API
- ✅ Enhanced with OwnedFeatureChain, CROSSES, Multiplicity ordering
- ✅ Spec-compliant grammar variant added

---

**Quick Start**: `npm install @sysml/grammar && import { parseSysML } from '@sysml/grammar'`
