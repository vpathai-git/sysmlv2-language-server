// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

import { EObject } from '../../emf_core/src/EObject.js';
import { IScope, IEObjectDescription } from './IScope.js';
import { IScopeProvider } from './IScopeProvider.js';

class SimpleScope implements IScope {
    constructor(private elements: EObject[]) {}
    
    getSingleElement(name: string): IEObjectDescription | undefined {
        const found = this.elements.find(e => e.eGet('name') === name);
        if (found) return this.createDesc(found);
        return undefined;
    }
    
    getElements(name: string): Iterable<IEObjectDescription> {
        return this.elements.filter(e => e.eGet('name') === name).map(e => this.createDesc(e));
    }
    
    getAllElements(): Iterable<IEObjectDescription> {
        return this.elements.map(e => this.createDesc(e));
    }
    
    private createDesc(e: EObject): IEObjectDescription {
        return {
            getName: () => e.eGet('name') as string,
            getEObjectOrProxy: () => e,
            getEClass: () => e.eClass(),
            getUserData: () => undefined
        };
    }
}

export class SimpleScopeProvider implements IScopeProvider {
    getScope(context: EObject, _reference: any): IScope {
        // Simple implementation: return all siblings
        const container = context.eContainer();
        if (container) {
            return new SimpleScope(container.eContents());
        }
        return new SimpleScope([]);
    }
}
