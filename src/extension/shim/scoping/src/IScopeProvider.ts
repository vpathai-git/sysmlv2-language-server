// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

import { EObject } from '../../emf_core/src/EObject.js';
import { IScope } from './IScope.js';

export interface IScopeProvider {
    getScope(context: EObject, reference: any): IScope;
}
