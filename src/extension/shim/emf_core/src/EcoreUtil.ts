// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

import { EObject, URI } from './EObject.js';
import { URIImpl } from './URI.js';

export class EcoreUtil {
    static resolve(proxy: EObject, context: EObject): EObject {
        if (!proxy.eIsProxy()) {
            return proxy;
        }
        
        const uriStr = (proxy as any)._proxyURI.toString();
        
        if (context.eResource()) {
            const res = context.eResource()!;
            const baseURI = res.getURI();
            
            // Check if it's a local reference (same resource)
            // Simple check: if proxy URI starts with base URI (without fragment)
            // Or if proxy URI is just a fragment
            
            let fragment = "";
            if (uriStr.startsWith("#")) {
                fragment = uriStr.substring(1);
            } else {
                const baseStr = baseURI.toString();
                if (uriStr.startsWith(baseStr)) {
                    fragment = uriStr.substring(baseStr.length);
                    if (fragment.startsWith("#")) fragment = fragment.substring(1);
                }
            }
            
            if (fragment) {
                const resolved = res.getEObject(fragment);
                if (resolved) return resolved;
            }
        }
        
        return proxy; 
    }

    static getURI(eObject: EObject): URI {
        if (eObject.eIsProxy()) {
            return URIImpl.createURI((eObject as any)._proxyURI);
        }

        const res = eObject.eResource();
        if (res) {
            const base = res.getURI().toString();
            const fragment = res.getURIFragment(eObject);
            return URIImpl.createURI(`${base}#${fragment}`);
        } else {
            return URIImpl.createURI("#//");
        }
    }

    static equals(obj1: EObject, obj2: EObject): boolean {
        return obj1 === obj2;
    }
    
    static create(_eClass: any): EObject {
        // Factory method stub
        throw new Error("Not implemented");
    }
}
