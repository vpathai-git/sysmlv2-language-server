// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

import { EObject } from '../../emf_core/src/EObject.js';

export interface IQualifiedNameProvider {
    getFullyQualifiedName(obj: EObject): string | undefined;
}
