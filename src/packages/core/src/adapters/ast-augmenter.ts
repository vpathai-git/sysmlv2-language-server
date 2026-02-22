// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

import { LangiumDocument, AstNode } from 'langium';
import { EObject, EClass, Resource } from '@sysml/shim';
import { LangiumResourceAdapter } from './resource-adapter.js';

// WeakMap to store adapters to ensure stability
const resourceAdapters = new WeakMap<LangiumDocument, LangiumResourceAdapter>();

/**
 * Augments the Langium AST with Shim EObject methods.
 * This allows the AST to be used directly by Shim-based code (like EcoreUtil).
 * 
 * @param document The Langium document to augment
 */
export function augmentAst(document: LangiumDocument): void {
    if (!document.parseResult || !document.parseResult.value) return;

    let adapter = resourceAdapters.get(document);
    if (!adapter) {
        adapter = new LangiumResourceAdapter(document);
        resourceAdapters.set(document, adapter);
    }

    const root = document.parseResult.value;
    augmentNode(root, adapter);
}

function augmentNode(node: AstNode, resource: Resource): void {
    const eObj = node as unknown as EObject;
    
    // Avoid re-patching if already patched
    if ((eObj as any)._isPatched) return;

    // Patch methods
    eObj.eResource = () => resource;
    eObj.eContainer = () => node.$container as unknown as EObject;
    eObj.eClass = () => createEClass(node.$type);
    eObj.eIsProxy = () => false;
    eObj.eContents = () => {
        const children: EObject[] = [];
        for (const key in node) {
            if (key === '$container' || key === '$type' || key === '$cstNode') continue;
            
            const value = (node as any)[key];
            if (typeof value === 'object' && value && '$type' in value) {
                children.push(value as unknown as EObject);
            } else if (Array.isArray(value)) {
                value.forEach(v => {
                    if (typeof v === 'object' && v && '$type' in v) {
                        children.push(v as unknown as EObject);
                    }
                });
            }
        }
        return children;
    };
    
    // Mark as patched
    (eObj as any)._isPatched = true;

    // Recurse
    for (const key in node) {
        if (key === '$container' || key === '$type' || key === '$cstNode') continue;

        const value = (node as any)[key];
        if (typeof value === 'object' && value && '$type' in value) {
            augmentNode(value, resource);
        } else if (Array.isArray(value)) {
            value.forEach(v => {
                if (typeof v === 'object' && v && '$type' in v) {
                    augmentNode(v, resource);
                }
            });
        }
    }
}

function createEClass(name: string): EClass {
    return {
        getName: () => name,
        getEPackage: () => ({ getName: () => 'SysML', getNsURI: () => 'http://sysml' }),
        getEStructuralFeature: (_featureName) => undefined
    };
}
