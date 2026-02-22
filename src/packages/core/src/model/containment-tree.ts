// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

/**
 * Containment Tree - Hierarchical ownership structure
 * Represents the package/namespace containment hierarchy
 */

import type { UUID } from './types.js';

export class ContainmentNode {
    readonly elementId: UUID;
    private parentNode: ContainmentNode | null = null;
    private childNodes: Map<string, ContainmentNode> = new Map();
    private cachedPath: string | null = null;

    constructor(elementId: UUID) {
        this.elementId = elementId;
    }

    get parent(): ContainmentNode | null {
        return this.parentNode;
    }

    get children(): ContainmentNode[] {
        return Array.from(this.childNodes.values());
    }

    /**
     * Add child node with name-based indexing
     */
    addChild(name: string, node: ContainmentNode): void {
        if (this.childNodes.has(name)) {
            throw new Error(`Duplicate child name: ${name}`);
        }
        this.childNodes.set(name, node);
        node.parentNode = this;
        node.invalidatePath();
    }

    /**
     * Remove child node
     */
    removeChild(name: string): ContainmentNode | undefined {
        const child = this.childNodes.get(name);
        if (child) {
            this.childNodes.delete(name);
            child.parentNode = null;
            child.invalidatePath();
        }
        return child;
    }

    /**
     * Get child by name
     */
    getChild(name: string): ContainmentNode | undefined {
        return this.childNodes.get(name);
    }

    /**
     * Get qualified path (cached for performance)
     */
    getQualifiedPath(getName: (id: UUID) => string | undefined): string {
        if (this.cachedPath === null) {
            const pathSegments: string[] = [];
            let current: ContainmentNode | null = this;

            while (current !== null) {
                const name = getName(current.elementId);
                if (name) {
                    pathSegments.unshift(name);
                }
                current = current.parentNode;
            }

            this.cachedPath = pathSegments.join('::');
        }
        return this.cachedPath;
    }

    /**
     * Invalidate cached path (on structure change)
     */
    private invalidatePath(): void {
        this.cachedPath = null;
        // Invalidate children's paths too
        for (const child of this.childNodes.values()) {
            child.invalidatePath();
        }
    }

    /**
     * Depth-first traversal
     */
    traverseDepthFirst(visitor: (node: ContainmentNode) => void): void {
        visitor(this);
        for (const child of this.childNodes.values()) {
            child.traverseDepthFirst(visitor);
        }
    }

    /**
     * Breadth-first traversal
     */
    traverseBreadthFirst(visitor: (node: ContainmentNode) => void): void {
        const queue: ContainmentNode[] = [this];
        while (queue.length > 0) {
            const node = queue.shift()!;
            visitor(node);
            queue.push(...node.children);
        }
    }
}

export class ContainmentTree {
    readonly root: ContainmentNode;
    private nodes: Map<UUID, ContainmentNode> = new Map();

    constructor(rootId: UUID) {
        this.root = new ContainmentNode(rootId);
        this.nodes.set(rootId, this.root);
    }

    /**
     * Get node by element ID
     */
    getNode(elementId: UUID): ContainmentNode | undefined {
        return this.nodes.get(elementId);
    }

    /**
     * Add element to tree
     */
    addElement(elementId: UUID, parentId: UUID, name: string): ContainmentNode {
        const parentNode = this.nodes.get(parentId);
        if (!parentNode) {
            throw new Error(`Parent node not found: ${parentId}`);
        }

        const newNode = new ContainmentNode(elementId);
        parentNode.addChild(name, newNode);
        this.nodes.set(elementId, newNode);

        return newNode;
    }

    /**
     * Remove element from tree
     */
    removeElement(elementId: UUID): void {
        const node = this.nodes.get(elementId);
        if (!node || !node.parent) {
            return;
        }

        // Find the name under which this node is stored
        for (const [name, child] of node.parent['childNodes'].entries()) {
            if (child === node) {
                node.parent.removeChild(name);
                break;
            }
        }

        // Remove from registry
        this.nodes.delete(elementId);

        // Remove all descendants
        node.traverseDepthFirst((n) => {
            if (n !== node) {
                this.nodes.delete(n.elementId);
            }
        });
    }
}
