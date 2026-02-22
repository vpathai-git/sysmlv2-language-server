# Validation Module

This module implements the validation framework for the SysML v2 Shim.

## Components

- **AbstractValidator**: Base class for validators.
- **ValidationIssue**: Interface for validation issues (Error, Warning, Info).
- **Severity**: Enum for issue severity.

## Verification

The module is verified using the "Scientific Derivation" process:
1.  **Isolation**: `AbstractValidator` defined in `src/`.
2.  **Stimulation**: Baseline in `capture/`.
3.  **Replication**: Implementation in `src/`.
4.  **Verification**: Tests in `test/`.

Run tests with:
```bash
cd src/shim/validation
npx tsc
node dist/shim/validation/test/Validation.spec.js
```
