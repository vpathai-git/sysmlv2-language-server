# Scoping Module

This module implements the scoping mechanisms for the SysML v2 Shim.

## Components

- **IScope**: Interface for looking up elements by name.
- **IQualifiedNameProvider**: Interface for computing the fully qualified name of an object.
- **IScopeProvider**: Interface for computing the scope for a given context and reference.
- **DefaultQualifiedNameProvider**: Default implementation that uses the `name` attribute and container hierarchy.
- **SimpleScopeProvider**: Simple implementation that provides a scope based on the container's contents.

## Verification

The module is verified using the "Scientific Derivation" process:
1.  **Isolation**: Interfaces are defined in `src/`.
2.  **Stimulation**: Baselines are defined in `capture/`.
3.  **Replication**: Implementations are in `src/`.
4.  **Verification**: Tests in `test/` compare the implementation against the baseline.

Run tests with:
```bash
cd src/shim/scoping
npx tsc
node dist/shim/scoping/test/IScope.spec.js
node dist/shim/scoping/test/IQualifiedNameProvider.spec.js
node dist/shim/scoping/test/IScopeProvider.spec.js
```
