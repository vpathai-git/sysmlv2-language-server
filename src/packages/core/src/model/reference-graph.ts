// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

/**
 * Reference Graph - Non-containment relationships
 * Represents all cross-references and relationships between elements
 */

import type { UUID, EdgeType } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export interface GraphEdge {
    id: UUID;
    type: EdgeType;
    source: UUID;
    target: UUID;
    attributes?: Map<string, any>;
}

export interface Path {
    nodes: UUID[];
    edges: GraphEdge[];
}

export interface Cycle {
    nodes: UUID[];
}

export class ReferenceGraph {
    private edges: Map<UUID, GraphEdge> = new Map();
    private edgesByType: Map<EdgeType, Set<UUID>> = new Map();
    private incomingEdges: Map<UUID, Set<UUID>> = new Map();
    private outgoingEdges: Map<UUID, Set<UUID>> = new Map();

    /**
     * Add edge to graph
     */
    addEdge(
        type: EdgeType,
        source: UUID,
        target: UUID,
        attributes?: Map<string, any>
    ): GraphEdge {
        const edge: GraphEdge = {
            id: uuidv4(),
            type,
            source,
            target,
            attributes
        };

        this.edges.set(edge.id, edge);

        // Update type index
        if (!this.edgesByType.has(type)) {
            this.edgesByType.set(type, new Set());
        }
        this.edgesByType.get(type)!.add(edge.id);

        // Update outgoing edges
        if (!this.outgoingEdges.has(source)) {
            this.outgoingEdges.set(source, new Set());
        }
        this.outgoingEdges.get(source)!.add(edge.id);

        // Update incoming edges
        if (!this.incomingEdges.has(target)) {
            this.incomingEdges.set(target, new Set());
        }
        this.incomingEdges.get(target)!.add(edge.id);

        return edge;
    }

    /**
     * Remove edge from graph
     */
    removeEdge(edgeId: UUID): void {
        const edge = this.edges.get(edgeId);
        if (!edge) return;

        this.edges.delete(edgeId);
        this.edgesByType.get(edge.type)?.delete(edgeId);
        this.outgoingEdges.get(edge.source)?.delete(edgeId);
        this.incomingEdges.get(edge.target)?.delete(edgeId);
    }

    /**
     * Get all edges of a specific type
     */
    getEdgesByType(type: EdgeType): GraphEdge[] {
        const edgeIds = this.edgesByType.get(type) || new Set();
        return Array.from(edgeIds)
            .map(id => this.edges.get(id))
            .filter((edge): edge is GraphEdge => edge !== undefined);
    }

    /**
     * Get outgoing edges from a node
     */
    getOutgoingEdges(nodeId: UUID, type?: EdgeType): GraphEdge[] {
        const edgeIds = this.outgoingEdges.get(nodeId) || new Set();
        const edges = Array.from(edgeIds)
            .map(id => this.edges.get(id))
            .filter((edge): edge is GraphEdge => edge !== undefined);

        return type ? edges.filter(e => e.type === type) : edges;
    }

    /**
     * Get incoming edges to a node
     */
    getIncomingEdges(nodeId: UUID, type?: EdgeType): GraphEdge[] {
        const edgeIds = this.incomingEdges.get(nodeId) || new Set();
        const edges = Array.from(edgeIds)
            .map(id => this.edges.get(id))
            .filter((edge): edge is GraphEdge => edge !== undefined);

        return type ? edges.filter(e => e.type === type) : edges;
    }

    /**
     * Find paths between two nodes
     */
    findPaths(from: UUID, to: UUID, maxDepth: number = 10): Path[] {
        const paths: Path[] = [];
        const visited = new Set<UUID>();

        const dfs = (current: UUID, path: UUID[], edgePath: GraphEdge[], depth: number) => {
            if (depth > maxDepth) return;
            if (current === to) {
                paths.push({ nodes: [...path, current], edges: [...edgePath] });
                return;
            }

            visited.add(current);
            const outgoing = this.getOutgoingEdges(current);

            for (const edge of outgoing) {
                if (!visited.has(edge.target)) {
                    dfs(
                        edge.target,
                        [...path, current],
                        [...edgePath, edge],
                        depth + 1
                    );
                }
            }
            visited.delete(current);
        };

        dfs(from, [], [], 0);
        return paths;
    }

    /**
     * Find cycles in the graph (alias for detectCycles)
     */
    findCycles(): Cycle[] {
        return this.detectCycles();
    }

    /**
     * Detect cycles in the graph
     */
    detectCycles(): Cycle[] {
        const cycles: Cycle[] = [];
        const visited = new Set<UUID>();
        const recursionStack = new Set<UUID>();
        const allNodes = new Set<UUID>();

        // Collect all nodes
        for (const edge of this.edges.values()) {
            allNodes.add(edge.source);
            allNodes.add(edge.target);
        }

        const detectCycleUtil = (nodeId: UUID, path: UUID[]): boolean => {
            visited.add(nodeId);
            recursionStack.add(nodeId);

            const outgoing = this.getOutgoingEdges(nodeId);
            for (const edge of outgoing) {
                if (!visited.has(edge.target)) {
                    if (detectCycleUtil(edge.target, [...path, nodeId])) {
                        return true;
                    }
                } else if (recursionStack.has(edge.target)) {
                    // Found cycle
                    const cycleStart = path.indexOf(edge.target);
                    if (cycleStart !== -1) {
                        cycles.push({ nodes: path.slice(cycleStart) });
                    }
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        for (const nodeId of allNodes) {
            if (!visited.has(nodeId)) {
                detectCycleUtil(nodeId, []);
            }
        }

        return cycles;
    }

    /**
     * Get impact set - all elements affected by changes to an element
     */
    getImpactSet(elementId: UUID, impactTypes?: Set<EdgeType>): Set<UUID> {
        const impacted = new Set<UUID>();
        const queue = [elementId];
        const visited = new Set<UUID>();

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current)) continue;
            visited.add(current);
            impacted.add(current);

            // Follow outgoing edges
            const outgoing = this.getOutgoingEdges(current);
            for (const edge of outgoing) {
                if (!impactTypes || impactTypes.has(edge.type)) {
                    queue.push(edge.target);
                }
            }

            // Follow certain incoming edges (e.g., specialization)
            const incoming = this.getIncomingEdges(current);
            for (const edge of incoming) {
                if (edge.type === 'specialization' || edge.type === 'redefinition') {
                    queue.push(edge.source);
                }
            }
        }

        return impacted;
    }
}
