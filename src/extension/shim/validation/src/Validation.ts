// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

import { EObject } from '../../emf_core/src/EObject.js';

export enum Severity {
    INFO,
    WARNING,
    ERROR
}

export interface ValidationIssue {
    message: string;
    severity: Severity;
    source: EObject;
    feature?: string;
}

export type CheckMethod = (object: EObject) => void;

export class AbstractValidator {
    private issues: ValidationIssue[] = [];

    protected error(message: string, source: EObject, feature?: string) {
        this.issues.push({ message, severity: Severity.ERROR, source, feature });
    }

    protected warning(message: string, source: EObject, feature?: string) {
        this.issues.push({ message, severity: Severity.WARNING, source, feature });
    }

    protected info(message: string, source: EObject, feature?: string) {
        this.issues.push({ message, severity: Severity.INFO, source, feature });
    }

    public validate(object: EObject): ValidationIssue[] {
        this.issues = [];
        
        // Find all methods starting with 'check' or decorated (if we had reflection)
        // For Shim, we'll iterate prototype methods
        const proto = Object.getPrototypeOf(this);
        const methods = Object.getOwnPropertyNames(proto)
            .filter(m => m.startsWith('check') && typeof (this as any)[m] === 'function');
            
        for (const method of methods) {
            // In a real implementation, we'd check the parameter type
            // Here we just pass the object and let the check decide or crash (Shim style)
            try {
                (this as any)[method](object);
            } catch (e) {
                // Ignore type mismatches or runtime errors in checks for now
            }
        }
        
        return this.issues;
    }
}
