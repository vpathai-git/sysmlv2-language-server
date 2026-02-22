// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

/**
 * Langium AST to EMF Adapter
 *
 * This module provides the critical bridge between Langium AST nodes and
 * EMF-style EObject API. It enables validation logic to operate
 * on the Langium parser output.
 */

import { AstNode, LangiumDocument } from 'langium';
import { EObject, EClass, EStructuralFeature, Resource, URI, EPackage } from './EObject.js';

// WeakMap cache to ensure identity: wrap(node) === wrap(node)
const adapterCache = new WeakMap<AstNode, AstNodeAdapter>();
const documentCache = new WeakMap<LangiumDocument, LangiumDocumentAdapter>();

/**
 * Wraps a Langium AstNode to provide EMF-style EObject API.
 * This is the main entry point for using the Shim with Langium.
 */
export function wrap(node: AstNode): EObject {
    return AstNodeAdapter.wrap(node);
}

/**
 * Wraps a LangiumDocument to provide EMF-style Resource API.
 */
export function wrapDocument(doc: LangiumDocument): Resource {
    return LangiumDocumentAdapter.wrap(doc);
}

/**
 * Unwraps an EObject back to its underlying AstNode.
 * Returns undefined if the EObject is not an AstNodeAdapter.
 */
export function unwrap(obj: EObject): AstNode | undefined {
    if (obj instanceof AstNodeAdapter) {
        return obj.$node;
    }
    return undefined;
}

/**
 * Type guard to check if an EObject wraps a Langium AstNode.
 */
export function isLangiumAdapter(obj: EObject): obj is AstNodeAdapter {
    return obj instanceof AstNodeAdapter;
}

/**
 * AstNodeAdapter wraps a Langium AstNode to provide EMF EObject API.
 */
export class AstNodeAdapter implements EObject {
    readonly $node: AstNode;
    private _eClass: EClass | undefined;

    private constructor(node: AstNode) {
        this.$node = node;
    }

    /**
     * Factory method to get or create an adapter for an AstNode.
     */
    static wrap(node: AstNode): AstNodeAdapter {
        let adapter = adapterCache.get(node);
        if (!adapter) {
            adapter = new AstNodeAdapter(node);
            adapterCache.set(node, adapter);
        }
        return adapter;
    }

    eClass(): EClass {
        if (!this._eClass) {
            this._eClass = createEClassForNode(this.$node);
        }
        return this._eClass;
    }

    eContainer(): EObject | undefined {
        const container = this.$node.$container;
        return container ? AstNodeAdapter.wrap(container) : undefined;
    }

    eResource(): Resource | undefined {
        // Navigate up to find a document
        let current: AstNode | undefined = this.$node;
        while (current) {
            const doc = (current as { $document?: LangiumDocument }).$document;
            if (doc) {
                return LangiumDocumentAdapter.wrap(doc);
            }
            current = current.$container;
        }
        return undefined;
    }

    eContents(): EObject[] {
        const contents: EObject[] = [];
        const node = this.$node as unknown as Record<string, unknown>;

        for (const key of Object.keys(node)) {
            if (key.startsWith('$')) continue; // Skip Langium internals

            const value = node[key];
            if (Array.isArray(value)) {
                for (const item of value) {
                    if (isAstNode(item)) {
                        contents.push(AstNodeAdapter.wrap(item));
                    }
                }
            } else if (isAstNode(value)) {
                contents.push(AstNodeAdapter.wrap(value));
            }
        }

        return contents;
    }

    eIsProxy(): boolean {
        // Langium handles proxies via References, but for now we say false
        return false;
    }

    eGet(feature: EStructuralFeature | string, _resolve: boolean = true): unknown {
        const featureName = typeof feature === 'string' ? feature : feature.getName();
        const value = (this.$node as unknown as Record<string, unknown>)[featureName];

        // Wrap AstNodes
        if (Array.isArray(value)) {
            return value.map(item => isAstNode(item) ? AstNodeAdapter.wrap(item) : item);
        } else if (isAstNode(value)) {
            return AstNodeAdapter.wrap(value);
        }

        return value ?? null;
    }

    eSet(feature: EStructuralFeature | string, newValue: unknown): void {
        const featureName = typeof feature === 'string' ? feature : feature.getName();

        // Unwrap EObjects back to AstNodes
        let unwrappedValue = newValue;
        if (newValue instanceof AstNodeAdapter) {
            unwrappedValue = newValue.$node;
        } else if (Array.isArray(newValue)) {
            unwrappedValue = newValue.map(item =>
                item instanceof AstNodeAdapter ? item.$node : item
            );
        }

        (this.$node as unknown as Record<string, unknown>)[featureName] = unwrappedValue;
    }

    eIsSet(feature: EStructuralFeature | string): boolean {
        const featureName = typeof feature === 'string' ? feature : feature.getName();
        const value = (this.$node as unknown as Record<string, unknown>)[featureName];
        return value !== undefined && value !== null;
    }

    eUnset(feature: EStructuralFeature | string): void {
        const featureName = typeof feature === 'string' ? feature : feature.getName();
        (this.$node as unknown as Record<string, unknown>)[featureName] = undefined;
    }

    // Internal shim methods (for compatibility with BasicEObject)
    _setEContainer(_container: EObject | undefined): void {
        // No-op for Langium adapter (container is determined by $container)
    }

    _setEResource(_resource: Resource | undefined): void {
        // No-op for Langium adapter (resource is determined by traversal)
    }

    _setProxyURI(_uri: unknown): void {
        // No-op for Langium adapter
    }

    toString(): string {
        return `AstNodeAdapter(${this.$node.$type})`;
    }
}

/**
 * LangiumDocumentAdapter wraps a LangiumDocument to provide EMF Resource API.
 */
export class LangiumDocumentAdapter implements Resource {
    readonly $document: LangiumDocument;
    private _uri: URI | undefined;

    private constructor(doc: LangiumDocument) {
        this.$document = doc;
    }

    static wrap(doc: LangiumDocument): LangiumDocumentAdapter {
        let adapter = documentCache.get(doc);
        if (!adapter) {
            adapter = new LangiumDocumentAdapter(doc);
            documentCache.set(doc, adapter);
        }
        return adapter;
    }

    getURI(): URI {
        if (!this._uri) {
            this._uri = createURIFromLangium(this.$document.uri);
        }
        return this._uri;
    }

    getContents(): EObject[] {
        const root = this.$document.parseResult?.value;
        return root ? [AstNodeAdapter.wrap(root)] : [];
    }

    *getAllContents(): IterableIterator<EObject> {
        const root = this.$document.parseResult?.value;
        if (!root) return;

        yield* this.traverseContents(AstNodeAdapter.wrap(root));
    }

    private *traverseContents(obj: EObject): IterableIterator<EObject> {
        yield obj;
        for (const child of obj.eContents()) {
            yield* this.traverseContents(child);
        }
    }

    getURIFragment(eObject: EObject): string {
        // Simple path-based fragment: //0/1/2
        if (!(eObject instanceof AstNodeAdapter)) return "/-1";

        const container = eObject.eContainer();
        if (!container) {
            const roots = this.getContents();
            const idx = roots.findIndex(r => r === eObject);
            return `//${idx}`;
        }

        const parentFrag = this.getURIFragment(container);
        const siblings = container.eContents();
        const idx = siblings.findIndex(s => s === eObject);
        return `${parentFrag}/${idx}`;
    }

    getEObject(uriFragment: string): EObject | undefined {
        if (!uriFragment.startsWith("//")) return undefined;

        const path = uriFragment.substring(2);
        if (path.length === 0) return undefined;

        const segments = path.split('/');
        const rootIdx = parseInt(segments[0]);
        const roots = this.getContents();

        if (isNaN(rootIdx) || rootIdx < 0 || rootIdx >= roots.length) return undefined;

        let current = roots[rootIdx];

        for (let i = 1; i < segments.length; i++) {
            const idx = parseInt(segments[i]);
            const children = current.eContents();
            if (isNaN(idx) || idx < 0 || idx >= children.length) return undefined;
            current = children[idx];
        }

        return current;
    }
}

// ============================================================================
// Helper functions
// ============================================================================

function isAstNode(value: unknown): value is AstNode {
    return typeof value === 'object' && value !== null && '$type' in value;
}

function createEClassForNode(node: AstNode): EClass {
    const typeName = node.$type;
    const features: EStructuralFeature[] = [];

    // Extract features from node properties
    const nodeObj = node as unknown as Record<string, unknown>;
    for (const key of Object.keys(nodeObj)) {
        if (key.startsWith('$')) continue;

        const value = nodeObj[key];
        const isMany = Array.isArray(value);
        const isContainment = isAstNode(value) ||
            (Array.isArray(value) && value.length > 0 && isAstNode(value[0]));

        features.push({
            getName: () => key,
            isMany: () => isMany,
            isContainment: () => isContainment,
        });
    }

    const sysmlPackage: EPackage = {
        getName: () => 'SysML',
        getNsURI: () => 'http://www.omg.org/spec/SysML/2.0',
    };

    return {
        getName: () => typeName,
        getEPackage: () => sysmlPackage,
        getEStructuralFeature: (name: string) =>
            features.find(f => f.getName() === name),
        eAllStructuralFeatures: features,
    };
}

function createURIFromLangium(uri: { path: string; scheme: string; toString(): string }): URI {
    return {
        toString: () => uri.toString(),
        fragment: () => '',
        trimFileExtension: () => createURIFromLangium({
            path: uri.path.replace(/\.[^.]+$/, ''),
            scheme: uri.scheme,
            toString: () => uri.toString().replace(/\.[^.]+$/, ''),
        }),
        lastSegment: () => uri.path.split('/').pop() || '',
        toFileString: () => uri.path,
        isFile: () => uri.scheme === 'file',
    };
}
