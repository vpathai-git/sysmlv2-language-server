// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

/**
 * SysML Model - Hybrid Tree-Graph Architecture
 * Combines containment tree and reference graph
 */

import { v4 as uuidv4 } from 'uuid';
import { ContainmentTree, ContainmentNode } from './containment-tree.js';
import { ReferenceGraph, GraphEdge } from './reference-graph.js';
import type { UUID, SysMLMetatype, EdgeType, ElementData } from './types.js';

export class SysMLElement {
    readonly id: UUID;
    readonly metatype: SysMLMetatype;
    private data: ElementData;
    private model: SysMLModel;

    constructor(id: UUID, metatype: SysMLMetatype, model: SysMLModel) {
        this.id = id;
        this.metatype = metatype;
        this.model = model;
        this.data = {
            id,
            metatype,
            attributes: new Map()
        };
    }

    get name(): string | undefined {
        return this.data.name;
    }

    set name(value: string | undefined) {
        this.data.name = value;
        this.data.qualifiedName = undefined; // Invalidate cached qualified name
    }

    get qualifiedName(): string {
        if (!this.data.qualifiedName) {
            const node = this.model.getContainmentNode(this.id);
            if (node) {
                this.data.qualifiedName = node.getQualifiedPath(
                    (id) => this.model.getElementById(id)?.name
                );
            }
        }
        return this.data.qualifiedName || this.name || '';
    }

    get parent(): SysMLElement | null {
        const node = this.model.getContainmentNode(this.id);
        if (node?.parent) {
            return this.model.getElementById(node.parent.elementId) || null;
        }
        return null;
    }

    get children(): SysMLElement[] {
        const node = this.model.getContainmentNode(this.id);
        if (!node) return [];
        return node.children
            .map(child => this.model.getElementById(child.elementId))
            .filter((el): el is SysMLElement => el !== undefined);
    }

    setAttribute(key: string, value: any): void {
        this.data.attributes.set(key, value);
    }

    getAttribute(key: string): any {
        return this.data.attributes.get(key);
    }

    getRelationships(type?: EdgeType): GraphEdge[] {
        return this.model.getRelationships(this.id, type);
    }
}

export class SysMLModel {
    private containmentTree: ContainmentTree;
    private referenceGraph: ReferenceGraph;
    private elements: Map<UUID, SysMLElement> = new Map();
    private indices: {
        byQualifiedName: Map<string, UUID>;
        byType: Map<SysMLMetatype, Set<UUID>>;
    };

    constructor() {
        const rootId = uuidv4();
        this.containmentTree = new ContainmentTree(rootId);
        this.referenceGraph = new ReferenceGraph();
        this.indices = {
            byQualifiedName: new Map(),
            byType: new Map()
        };

        // Create root element
        const rootMetatype = 'Package' as SysMLMetatype;
        const root = new SysMLElement(rootId, rootMetatype, this);
        root.name = 'root';
        this.elements.set(rootId, root);

        // Add root to type index
        if (!this.indices.byType.has(rootMetatype)) {
            this.indices.byType.set(rootMetatype, new Set());
        }
        this.indices.byType.get(rootMetatype)!.add(rootId);
    }

    /**
     * Create new element
     */
    createElement(
        metatype: SysMLMetatype,
        name: string,
        parentId?: UUID
    ): SysMLElement {
        const id = uuidv4();
        const element = new SysMLElement(id, metatype, this);
        element.name = name;

        this.elements.set(id, element);

        // Add to containment tree
        const parent = parentId || this.containmentTree.root.elementId;
        this.containmentTree.addElement(id, parent, name);

        // Update indices
        if (!this.indices.byType.has(metatype)) {
            this.indices.byType.set(metatype, new Set());
        }
        this.indices.byType.get(metatype)!.add(id);

        return element;
    }

    /**
     * Get element by ID
     */
    getElementById(id: UUID): SysMLElement | undefined {
        return this.elements.get(id);
    }

    /**
     * Get element by qualified name
     */
    getElementByQualifiedName(qualifiedName: string): SysMLElement | undefined {
        // TODO: Build and use qualified name index
        for (const element of this.elements.values()) {
            if (element.qualifiedName === qualifiedName) {
                return element;
            }
        }
        return undefined;
    }

    /**
     * Get elements by type
     * @param metatype - The metatype to filter by
     * @param includeRoot - Whether to include the root element (default: false)
     */
    getElementsByType(metatype: SysMLMetatype, includeRoot: boolean = false): SysMLElement[] {
        const ids = this.indices.byType.get(metatype) || new Set();
        return Array.from(ids)
            .map(id => this.elements.get(id))
            .filter((el): el is SysMLElement => el !== undefined)
            .filter(el => includeRoot || el.id !== this.containmentTree.root.elementId);
    }

    /**
     * Add relationship between elements
     */
    addRelationship(
        type: EdgeType,
        sourceId: UUID,
        targetId: UUID
    ): GraphEdge {
        return this.referenceGraph.addEdge(type, sourceId, targetId);
    }

    /**
     * Get relationships for an element
     */
    getRelationships(elementId: UUID, type?: EdgeType): GraphEdge[] {
        const outgoing = this.referenceGraph.getOutgoingEdges(elementId, type);
        const incoming = this.referenceGraph.getIncomingEdges(elementId, type);
        return [...outgoing, ...incoming];
    }

    /**
     * Get containment node for element
     */
    getContainmentNode(elementId: UUID): ContainmentNode | undefined {
        return this.containmentTree.getNode(elementId);
    }

    /**
     * Get reference graph (for advanced graph operations)
     */
    getReferenceGraph(): ReferenceGraph {
        return this.referenceGraph;
    }

    /**
     * Add edge to reference graph (alias for addRelationship)
     * @param sourceId - Source element ID
     * @param targetId - Target element ID
     * @param type - Edge type
     */
    addEdge(sourceId: UUID, targetId: UUID, type: EdgeType): GraphEdge {
        return this.referenceGraph.addEdge(type, sourceId, targetId);
    }

    /**
     * Validate model structure
     */
    validate(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check for cycles in specialization
        const cycles = this.referenceGraph.detectCycles();
        if (cycles.length > 0) {
            errors.push(`Found ${cycles.length} circular dependencies`);
        }

        // Check all elements have valid parents
        for (const element of this.elements.values()) {
            const node = this.containmentTree.getNode(element.id);
            if (!node) {
                errors.push(`Element ${element.id} not in containment tree`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Serialize model to JSON
     */
    toJSON(): any {
        const elements: any[] = [];
        const relationships: any[] = [];

        // Serialize elements in tree order
        this.containmentTree.root.traverseDepthFirst((node) => {
            const element = this.elements.get(node.elementId);
            if (element) {
                elements.push({
                    id: element.id,
                    type: element.metatype,
                    name: element.name,
                    parentId: element.parent?.id
                });
            }
        });

        // Serialize relationships
        for (const edge of this.referenceGraph['edges'].values()) {
            relationships.push({
                id: edge.id,
                type: edge.type,
                source: edge.source,
                target: edge.target
            });
        }

        return {
            version: '2.0',
            elements,
            relationships
        };
    }
}
