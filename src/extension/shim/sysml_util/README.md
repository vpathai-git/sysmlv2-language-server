# SysML Util Module

This module provides SysML-specific utility functions.

## Components

- **SysMLUtil**: Base utility class for SysML operations.

## Verification

The module is verified using the "Scientific Derivation" process:
1.  **Isolation**: `SysMLUtil` defined in `src/`.
2.  **Stimulation**: Baseline in `capture/`.
3.  **Replication**: Implementation in `src/`.
4.  **Verification**: Tests in `test/`.

Run tests with:
```bash
cd src/shim/sysml_util
npx tsc
node dist/shim/sysml_util/test/SysMLUtil.spec.js
```
