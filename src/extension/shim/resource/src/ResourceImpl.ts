// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

import { EObject, Resource, URI } from '../../emf_core/src/EObject.js';
import { URIImpl } from '../../emf_core/src/URI.js';

export { URIImpl };

export class ResourceImpl implements Resource {
    private _uri: URI;
    private _contents: EObject[] = [];

    constructor(uri?: URI) {
        this._uri = uri || new URIImpl("http://unknown");
    }

    getURI(): URI {
        return this._uri;
    }
    
    setURI(uri: URI): void {
        this._uri = uri;
    }

    getContents(): EObject[] {
        return this._contents;
    }

    getAllContents(): IterableIterator<EObject> {
        return new TreeIterator(this._contents);
    }

    getURIFragment(eObject: EObject): string {
        // Simple path-based implementation: //0/1/2
        const res = eObject.eResource();
        if (res !== this) return "/-1";

        const container = eObject.eContainer();
        if (!container) {
            const idx = this._contents.indexOf(eObject);
            return `//${idx}`;
        }

        const parentFrag = this.getURIFragment(container);
        const siblings = container.eContents();
        const idx = siblings.indexOf(eObject);
        return `${parentFrag}/${idx}`;
    }

    getEObject(uriFragment: string): EObject | undefined {
        if (!uriFragment.startsWith("//")) return undefined;
        
        const path = uriFragment.substring(2); // Remove //
        if (path.length === 0) return undefined;

        const segments = path.split('/');
        
        // 1. Find root
        const rootIdx = parseInt(segments[0]);
        if (isNaN(rootIdx) || rootIdx < 0 || rootIdx >= this._contents.length) return undefined;
        
        let current = this._contents[rootIdx];
        
        // 2. Traverse children
        for (let i = 1; i < segments.length; i++) {
            const idx = parseInt(segments[i]);
            const children = current.eContents();
            if (isNaN(idx) || idx < 0 || idx >= children.length) return undefined;
            current = children[idx];
        }
        
        return current;
    }
}

class TreeIterator implements IterableIterator<EObject> {
    private _stack: EObject[] = [];

    constructor(roots: EObject[]) {
        // We iterate roots, and for each root, we yield it, then its contents
        // To match EMF TreeIterator:
        // It yields the object, then its children (depth-first)
        // So we push roots in reverse order to stack?
        // Or just use a generator
        this._stack = [...roots].reverse();
    }

    [Symbol.iterator](): IterableIterator<EObject> {
        return this;
    }

    next(): IteratorResult<EObject> {
        if (this._stack.length === 0) {
            return { done: true, value: undefined };
        }

        const current = this._stack.pop()!;
        
        // Add children to stack (in reverse order to process first child first)
        const children = current.eContents();
        for (let i = children.length - 1; i >= 0; i--) {
            this._stack.push(children[i]);
        }

        return { done: false, value: current };
    }
}
