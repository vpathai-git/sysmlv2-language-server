// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

import { Resource, URI, EObject } from '@sysml/shim';
import { LangiumDocument } from 'langium';

/**
 * Adapts a LangiumDocument to the Shim Resource interface.
 * This allows Shim-based code (like Validators) to interact with Langium documents
 * as if they were EMF Resources.
 */
export class LangiumResourceAdapter implements Resource {
    private _document: LangiumDocument;
    private _uri: URI;

    constructor(document: LangiumDocument) {
        this._document = document;
        // Convert VSCode URI to Shim URI
        // Note: Shim URI expects string, VSCode URI.toString() gives string
        this._uri = {
            toString: () => document.uri.toString(),
            fragment: () => document.uri.fragment,
            trimFileExtension: () => {
                // Simple implementation using string manipulation
                const str = document.uri.toString();
                const lastDot = str.lastIndexOf('.');
                return {
                    toString: () => lastDot > 0 ? str.substring(0, lastDot) : str
                } as any;
            },
            lastSegment: () => {
                const path = document.uri.path;
                const parts = path.split('/');
                return parts[parts.length - 1];
            },
            toFileString: () => document.uri.fsPath,
            isFile: () => document.uri.scheme === 'file'
        } as URI;
    }

    getURI(): URI {
        return this._uri;
    }

    getContents(): EObject[] {
        // Langium AST root is the content
        // We cast it to EObject (Shim) because our grammar ensures structural compatibility
        return [this._document.parseResult.value as unknown as EObject];
    }

    getAllContents(): IterableIterator<EObject> {
        // Use Langium's AstUtils or simple traversal
        // For now, delegate to Shim's TreeIterator logic if possible, 
        // or implement a simple generator over Langium AST
        return this.treeIterator(this._document.parseResult.value as unknown as EObject);
    }

    getURIFragment(_eObject: EObject): string {
        // Langium uses JSON pointer or path-based fragments
        // We need to map this to EMF fragment format if they differ
        // For now, assume simple path compatibility or implement path finding
        return "/0"; // Placeholder
    }

    getEObject(_uriFragment: string): EObject | undefined {
        // Resolve fragment against Langium AST
        return undefined; // Placeholder
    }

    private *treeIterator(root: EObject): IterableIterator<EObject> {
        yield root;
        if (root.eContents) {
            for (const child of root.eContents()) {
                yield* this.treeIterator(child);
            }
        }
    }
}
