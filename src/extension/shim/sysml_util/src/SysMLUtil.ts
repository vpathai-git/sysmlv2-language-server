// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

import { EObject } from '../../emf_core/src/EObject.js';

export class SysMLUtil {
    static getVersion(): string {
        return "2.0";
    }
    
    // Placeholder for future SysML specific utilities
    static isSysML(obj: EObject): boolean {
        return obj.eClass().getEPackage().getName() === "SysML";
    }
}
