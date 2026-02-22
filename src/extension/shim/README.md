# SysML v2 Shim

The **SysML v2 Shim** is a TypeScript implementation of the Eclipse Modeling Framework (EMF) and related utilities, designed to replace the EMF dependencies in the SysML v2 language server and extension.

## Architecture

The Shim is organized into modular components:

- **emf_core**: Core EMF interfaces and classes (`EObject`, `EClass`, `EcoreUtil`, `URI`).
- **resource**: Resource management (`Resource`, `ResourceImpl`).
- **scoping**: Scoping and naming (`IScope`, `IQualifiedNameProvider`).
- **validation**: Validation framework (`AbstractValidator`).
- **sysml_util**: SysML-specific utilities (`SysMLUtil`).

## Usage

The Shim is packaged as `@sysml/shim`.

```typescript
import { BasicEObject, EcoreUtil, URI } from '@sysml/shim';

const obj = new BasicEObject();
const uri = URI.createURI("file:///model.sysml");
```

## Development

### Build
```bash
npm install
npm run build
```

### Verification
Each module has its own verification tests following the "Scientific Derivation" process (Isolation -> Stimulation -> Replication -> Verification).

See individual module READMEs for details.
