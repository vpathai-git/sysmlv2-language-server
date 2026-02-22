// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

import { EObject } from '../../emf_core/src/EObject.js';
import { IQualifiedNameProvider } from './IQualifiedNameProvider.js';

export class DefaultQualifiedNameProvider implements IQualifiedNameProvider {
    getFullyQualifiedName(obj: EObject): string | undefined {
        const name = obj.eGet('name');
        if (typeof name === 'string') {
            const container = obj.eContainer();
            if (container) {
                const parentName = this.getFullyQualifiedName(container);
                if (parentName) {
                    return parentName + '.' + name;
                }
            }
            return name;
        }
        return undefined;
    }
}
