/**
 * SysML Scope Computation
 *
 * Custom ScopeComputation that correctly traverses SysML's relationship-based
 * AST structure to find and export named elements.
 *
 * Rationale: Correctly traverses SysML's relationship-based AST structure.
 * Includes conjugated port resolution via synthetic ~Name entries.
 * Includes short name resolution per SysML v2 specification.
 *
 * ADR-002 Implementation:
 * For each PortDefinition, we add a synthetic ConjugatedPortDefinition entry
 * with name '~' + portName (per SysML v2 spec conjugated port naming).
 *
 * ADR-003 Implementation:
 * For each element with both declaredName and declaredShortName, we export
 * the element under BOTH names (memberShortName handling per spec).
 *
 * Note: Exports use SIMPLE names for Langium index compatibility. Qualified name
 * resolution is handled by the scope provider (scope-adapter.ts) which resolves
 * qualified references segment-by-segment.
 *
 * In SysML, named elements are nested inside Membership relationships:
 * - Package -> ownedRelationship -> OwningMembership -> ownedRelatedElement -> PartDefinition
 *
 * The default Langium ScopeComputation doesn't know about this structure.
 */

import type { AstNode, AstNodeDescription, LangiumDocument, LocalSymbols, LangiumCoreServices, ScopeComputation } from 'langium';
import { MultiMap } from 'langium';

/**
 * Custom ScopeComputation for SysML that handles the relationship-based AST.
 */
export class SysMLScopeComputation implements ScopeComputation {
    private readonly services: LangiumCoreServices;

    constructor(services: LangiumCoreServices) {
        this.services = services;
    }

    /**
     * Langium ScopeComputation interface: async wrapper for computeExports.
     * Called by DefaultIndexManager during document indexing.
     */
    async collectExportedSymbols(document: LangiumDocument): Promise<AstNodeDescription[]> {
        return this.computeExports(document);
    }

    /**
     * Langium ScopeComputation interface: async wrapper for computeLocalScopes.
     * Called by DefaultDocumentBuilder during scope computation phase.
     */
    async collectLocalSymbols(document: LangiumDocument): Promise<LocalSymbols> {
        return this.computeLocalScopes(document);
    }

    /**
     * Compute exports for a document - what names are visible from outside.
     * Exports all named elements with their simple names for Langium index.
     */
    computeExports(document: LangiumDocument): AstNodeDescription[] {
        const exports: AstNodeDescription[] = [];
        const root = document.parseResult?.value;

        if (!root) {
            return exports;
        }

        // Traverse AST and collect all named elements
        this.collectExports(root, exports, document);

        return exports;
    }

    /**
     * Compute local scopes - what names are visible at each point in the document.
     */
    computeLocalScopes(document: LangiumDocument): LocalSymbols {
        const scopes = new MultiMap<AstNode, AstNodeDescription>();
        const root = document.parseResult?.value;

        if (!root) {
            return scopes;
        }

        // Traverse and compute scopes for each namespace
        this.computeScopes(root, scopes, document);

        return scopes;
    }

    /**
     * Recursively collect exported names from the AST.
     * Exports both the element and its owning Membership (for imports to work).
     *
     * ADR-002: For each PortDefinition, also exports a synthetic
     * ConjugatedPortDefinition with name '~' + portName.
     *
     * ADR-003: For each element with declaredShortName, also exports
     * the element under that short name (per SysML v2 spec memberShortName handling).
     */
    private collectExports(
        node: AstNode,
        exports: AstNodeDescription[],
        document: LangiumDocument
    ): void {
        // Check if this node has a name
        const name = this.getName(node);
        if (name) {
            // Create description with simple name and add to exports
            const desc = this.createDescription(node, name, document);
            exports.push(desc);

            // Also export the owning Membership with the same name
            // This is needed because imports reference Memberships, not elements
            const container = (node as any).$container;
            if (container && this.isMembership(container)) {
                const membershipDesc = this.createDescription(container, name, document);
                exports.push(membershipDesc);
            }

            // ADR-002: Add synthetic ConjugatedPortDefinition entry
            if (this.isPortDefinition(node)) {
                const conjugatedName = '~' + name;
                const conjugatedDesc = this.createConjugatedDescription(node, conjugatedName, document);
                exports.push(conjugatedDesc);
            }
        }

        // ADR-003: Also export by short name if it exists and differs from name
        const shortName = this.getShortName(node);
        if (shortName && shortName !== name) {
            const shortNameDesc = this.createDescription(node, shortName, document);
            exports.push(shortNameDesc);

            // Also export the owning Membership with the short name
            const container = (node as any).$container;
            if (container && this.isMembership(container)) {
                const membershipDesc = this.createDescription(container, shortName, document);
                exports.push(membershipDesc);
            }
        }

        // Traverse into relationships (SysML pattern)
        this.traverseChildren(node, (child) => {
            this.collectExports(child, exports, document);
        });
    }

    /**
     * Check if a node is a Membership type.
     */
    private isMembership(node: AstNode): boolean {
        const type = node.$type;
        return type === 'Membership' ||
               type === 'OwningMembership' ||
               type === 'FeatureMembership' ||
               type === 'EndFeatureMembership' ||
               type?.endsWith('Membership');
    }

    /**
     * Compute scopes for all namespaces in the AST.
     *
     * ADR-002: Also adds synthetic ConjugatedPortDefinition entries
     * to local scopes for each PortDefinition.
     *
     * ADR-003: Also adds elements by their short names to local scopes.
     */
    private computeScopes(
        node: AstNode,
        scopes: MultiMap<AstNode, AstNodeDescription>,
        document: LangiumDocument
    ): void {
        // If this is a namespace-like element, collect its members as local scope
        if (this.isNamespace(node)) {
            const members: AstNodeDescription[] = [];

            // Collect owned members
            this.traverseChildren(node, (child) => {
                const childName = this.getName(child);
                if (childName) {
                    const desc = this.createDescription(child, childName, document);
                    members.push(desc);

                    // ADR-002: Add synthetic ConjugatedPortDefinition to local scope
                    if (this.isPortDefinition(child)) {
                        const conjugatedName = '~' + childName;
                        const conjugatedDesc = this.createConjugatedDescription(child, conjugatedName, document);
                        members.push(conjugatedDesc);
                    }
                }

                // ADR-003: Also add by short name if it exists
                const childShortName = this.getShortName(child);
                if (childShortName && childShortName !== childName) {
                    const shortNameDesc = this.createDescription(child, childShortName, document);
                    members.push(shortNameDesc);
                }
            });

            // Add to scopes
            for (const member of members) {
                scopes.add(node, member);
            }
        }

        // Recurse into children
        this.traverseChildren(node, (child) => {
            this.computeScopes(child, scopes, document);
        });
    }

    /**
     * Get the name of an AST node (handles SysML naming conventions).
     */
    private getName(node: AstNode): string | undefined {
        const nodeAny = node as any;
        return nodeAny.declaredName ?? nodeAny.name ?? nodeAny.memberName ?? undefined;
    }

    /**
     * Get the short name of an AST node.
     * ADR-003: memberShortName handling per SysML v2 spec.
     */
    private getShortName(node: AstNode): string | undefined {
        const nodeAny = node as any;
        return nodeAny.declaredShortName ?? nodeAny.shortName ?? nodeAny.memberShortName ?? undefined;
    }

    /**
     * Check if a node is a namespace-like element.
     */
    private isNamespace(node: AstNode): boolean {
        const type = node.$type;
        return type === 'Namespace' ||
               type === 'Package' ||
               type === 'LibraryPackage' ||
               type === 'RootNamespace' ||
               type?.endsWith('Definition') ||
               type?.endsWith('Usage') ||
               type === 'Type' ||
               type === 'Class' ||
               type === 'Classifier' ||
               type === 'Feature';
    }

    /**
     * Check if a node is a PortDefinition.
     * ADR-002: Used to identify nodes that need synthetic conjugated port entries.
     */
    private isPortDefinition(node: AstNode): boolean {
        return node.$type === 'PortDefinition';
    }

    /**
     * Traverse children through SysML's relationship structure.
     */
    private traverseChildren(node: AstNode, callback: (child: AstNode) => void): void {
        const nodeAny = node as any;

        // Check ownedRelationship (primary SysML pattern)
        if (Array.isArray(nodeAny.ownedRelationship)) {
            for (const rel of nodeAny.ownedRelationship) {
                // Each relationship may contain owned or referenced elements
                if (Array.isArray(rel?.ownedRelatedElement)) {
                    for (const elem of rel.ownedRelatedElement) {
                        callback(elem);
                    }
                } else if (rel?.ownedRelatedElement) {
                    callback(rel.ownedRelatedElement);
                }

                // Also check memberElement for non-owning memberships
                if (rel?.memberElement && typeof rel.memberElement === 'object') {
                    callback(rel.memberElement);
                }

                // And ownedMemberElement
                if (rel?.ownedMemberElement && typeof rel.ownedMemberElement === 'object') {
                    callback(rel.ownedMemberElement);
                }
            }
        }

        // Check ownedMember (alternative pattern)
        if (Array.isArray(nodeAny.ownedMember)) {
            for (const member of nodeAny.ownedMember) {
                callback(member);
            }
        }
    }

    /**
     * Create an AstNodeDescription for a named element.
     */
    private createDescription(
        node: AstNode,
        name: string,
        document: LangiumDocument
    ): AstNodeDescription {
        return {
            node,
            name,
            type: node.$type,
            documentUri: document.uri,
            path: this.services.workspace.AstNodeLocator.getAstNodePath(node)
        };
    }

    /**
     * Create a synthetic ConjugatedPortDefinition description.
     * ADR-002: Per SysML v2 spec conjugated port naming convention.
     *
     * The synthetic entry has:
     * - name: '~' + portName (e.g., '~TowelPort')
     * - type: 'ConjugatedPortDefinition'
     * - node: points to the original PortDefinition (for go-to-definition)
     */
    private createConjugatedDescription(
        portDefNode: AstNode,
        conjugatedName: string,
        document: LangiumDocument
    ): AstNodeDescription {
        return {
            node: portDefNode,  // Point to original for go-to-definition
            name: conjugatedName,
            type: 'ConjugatedPortDefinition',  // Synthetic type for scope resolution
            documentUri: document.uri,
            path: this.services.workspace.AstNodeLocator.getAstNodePath(portDefNode)
        };
    }
}

/**
 * Factory function to create SysML scope computation.
 */
export function createSysMLScopeComputation(services: LangiumCoreServices): SysMLScopeComputation {
    return new SysMLScopeComputation(services);
}
