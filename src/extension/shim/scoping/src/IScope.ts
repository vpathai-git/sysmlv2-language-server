// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

import { EObject, EClass } from '../../emf_core/src/EObject.js';

export interface IEObjectDescription {
    getName(): string; // Simplified from QualifiedName
    getEObjectOrProxy(): EObject;
    getEClass(): EClass;
    getUserData(key: string): string | undefined;
}

export interface IScope {
    getSingleElement(name: string): IEObjectDescription | undefined;
    getElements(name: string): Iterable<IEObjectDescription>;
    getAllElements(): Iterable<IEObjectDescription>;
}
