/**
 * SysML Scope Provider Adapter
 *
 * LSP-002: Implements functional scope provider for cross-reference resolution,
 * code completion, and navigation.
 *
 *
 */

import { ScopeProvider, AstNode, ReferenceInfo, AstNodeDescription, Scope, EMPTY_SCOPE, IndexManager, LangiumDocuments, AstNodeLocator } from 'langium';
import { stream, Stream } from 'langium';
import { URI } from 'langium';
import type { LangiumCoreServices } from 'langium';

const visited = new Set<AstNode>();

function addVisited(element: AstNode): void {
    visited.add(element);
}

function removeVisited(element: AstNode): void {
    visited.delete(element);
}

function isVisited(element: AstNode): boolean {
    return visited.has(element);
}

function clearVisited(): void {
    visited.clear();
}

/**
 * Gets the document URI for an AST node.
 */
function getDocumentUri(node: AstNode): URI {
    const root = getRootNode(node);
    const document = (root as any).$document;
    return document?.uri ?? URI.parse('inmemory://unknown');
}

/**
 * Gets the root node of an AST node.
 */
function getRootNode(node: AstNode): AstNode {
    let current = node;
    while ((current as any).$container) {
        current = (current as any).$container;
    }
    return current;
}

/**
 * Gets the path to an AST node within its document.
 */
function getAstNodePath(node: AstNode): string {
    const segments: string[] = [];
    let current: AstNode | undefined = node;

    while (current) {
        const container = (current as any).$container as AstNode | undefined;
        if (container) {
            const containerProperty = (current as any).$containerProperty as string | undefined;
            const containerIndex = (current as any).$containerIndex as number | undefined;

            if (containerProperty) {
                if (containerIndex !== undefined) {
                    segments.unshift(`${containerProperty}@${containerIndex}`);
                } else {
                    segments.unshift(containerProperty);
                }
            }
        }
        current = container;
    }

    return segments.length > 0 ? '/' + segments.join('/') : '/';
}

/**
 * Normalizes an unrestricted name by stripping surrounding quotes.
 * SysML allows quoted names like 'entry' or "special name".
 * These should match their unquoted equivalents.
 *
 */
function normalizeUnrestrictedName(name: string): string {
    if (!name || name.length < 2) return name;

    // Check for single or double quotes
    const first = name.charAt(0);
    const last = name.charAt(name.length - 1);

    if ((first === "'" && last === "'") || (first === '"' && last === '"')) {
        return name.substring(1, name.length - 1);
    }

    return name;
}

/**
 * Gets the effective name (including short name) for a node.
 */
function getEffectiveName(node: AstNode): string | undefined {
    const nodeAny = node as any;
    return nodeAny.name ?? nodeAny.declaredName ?? undefined;
}

function getShortName(node: AstNode): string | undefined {
    const nodeAny = node as any;
    return nodeAny.shortName ?? nodeAny.declaredShortName ?? undefined;
}

/**
 * Checks if a node is a Feature (for feature path resolution).
 */
function isFeature(node: AstNode): boolean {
    const type = node.$type;
    return type === 'Feature' ||
           type === 'Step' ||
           type === 'Expression' ||
           type === 'BooleanExpression' ||
           type === 'Invariant' ||
           type === 'Connector' ||
           type === 'BindingConnector' ||
           type === 'Succession' ||
           type === 'ItemFlow' ||
           type === 'SuccessionItemFlow' ||
           type === 'Flow' ||
           type?.endsWith('Usage');
}

/**
 * Gets the types of a Feature from its ownedTyping relationships.
 * Returns an array of Type nodes that the feature is typed by.
 *
 */
function getFeatureTypes(feature: AstNode): AstNode[] {
    const types: AstNode[] = [];
    const featureAny = feature as any;

    // Check ownedRelationship for FeatureTyping
    const ownedRelationship = featureAny.ownedRelationship;
    if (Array.isArray(ownedRelationship)) {
        for (const rel of ownedRelationship) {
            if (rel.$type === 'FeatureTyping' && rel.type) {
                // Use safe reference access to avoid triggering cycles
                const typeNode = safeGetRef(rel.type);
                if (typeNode) {
                    types.push(typeNode);
                }
            }
        }
    }

    return types;
}

/**
 * Checks if a node is a Membership type.
 * Memberships own elements and provide visibility/access control.
 */
function isMembership(node: AstNode): boolean {
    const type = node.$type;
    return type === 'Membership' ||
           type === 'OwningMembership' ||
           type === 'FeatureMembership' ||
           type === 'EndFeatureMembership' ||
           type === 'VariantMembership' ||
           type === 'ElementFilterMembership' ||
           type?.endsWith('Membership');
}

/**
 * Gets the member element from a Membership.
 * Returns the ownedRelatedElement or memberElement from the membership.
 */
function getMemberElement(membership: AstNode): AstNode | undefined {
    const membershipAny = membership as any;
    // Try ownedRelatedElement first (for owning memberships)
    if (Array.isArray(membershipAny.ownedRelatedElement)) {
        return membershipAny.ownedRelatedElement[0];
    } else if (membershipAny.ownedRelatedElement) {
        return membershipAny.ownedRelatedElement;
    }
    // Then try memberElement (for non-owning memberships)
    if (membershipAny.memberElement) {
        // memberElement might be a reference
        const ref = safeGetRef(membershipAny.memberElement);
        if (ref) return ref;
        return membershipAny.memberElement;
    }
    // Try ownedMemberElement
    if (membershipAny.ownedMemberElement) {
        return membershipAny.ownedMemberElement;
    }
    return undefined;
}

/**
 * Checks if a node is a Namespace (uses type hierarchy check, not hardcoded list).
 */
function isNamespace(node: AstNode): boolean {
    const type = node.$type;
    // Namespace and its subtypes per SysML metamodel
    return type === 'Namespace' ||
           type === 'Package' ||
           type === 'RootNamespace' ||
           type === 'LibraryPackage' ||
           // Type and subtypes
           type === 'Type' ||
           type === 'Class' ||
           type === 'Classifier' ||
           type === 'DataType' ||
           type === 'Association' ||
           type === 'AssociationStructure' ||
           type === 'Behavior' ||
           type === 'Function' ||
           type === 'Predicate' ||
           type === 'Interaction' ||
           type === 'Structure' ||
           type === 'Metaclass' ||
           // Feature and subtypes
           type === 'Feature' ||
           type === 'Step' ||
           type === 'Expression' ||
           type === 'BooleanExpression' ||
           type === 'Invariant' ||
           type === 'Connector' ||
           type === 'BindingConnector' ||
           type === 'Succession' ||
           // SysML Definitions (all are Types, thus Namespaces)
           type?.endsWith('Definition') ||
           // SysML Usages (all are Features, thus Namespaces)
           type?.endsWith('Usage');
}

/**
 * Checks if a node is a Type (subset of Namespace).
 */
function isType(node: AstNode): boolean {
    const type = node.$type;
    return type === 'Type' ||
           type === 'Class' ||
           type === 'Classifier' ||
           type === 'DataType' ||
           type === 'Association' ||
           type === 'AssociationStructure' ||
           type === 'Behavior' ||
           type === 'Function' ||
           type === 'Predicate' ||
           type === 'Interaction' ||
           type === 'Structure' ||
           type === 'Metaclass' ||
           type?.endsWith('Definition') ||
           type?.endsWith('Usage');
}

/**
 * Checks if a node is an Expression (for getNonExpressionNamespace).
 */
function isExpression(node: AstNode): boolean {
    const type = node.$type;
    return type === 'Expression' ||
           type === 'FeatureReferenceExpression' ||
           type === 'FeatureChainExpression' ||
           type === 'InvocationExpression' ||
           type === 'OperatorExpression' ||
           type === 'LiteralExpression' ||
           type === 'NullExpression' ||
           type === 'MetadataAccessExpression' ||
           type === 'CollectExpression' ||
           type === 'SelectExpression' ||
           type?.endsWith('Expression');
}

/**
 * Gets the parent namespace of an element.
 */
function getParentNamespaceOf(element: AstNode): AstNode | undefined {
    let current: AstNode | undefined = (element as any).$container;
    while (current) {
        if (isNamespace(current)) {
            return current;
        }
        current = (current as any).$container;
    }
    return undefined;
}

/**
 * Gets the non-expression namespace for an element.
 * Skips expression contexts to find the enclosing non-expression namespace.
 */
function getNonExpressionNamespaceFor(element: AstNode): AstNode | undefined {
    let namespace = getParentNamespaceOf(element);
    while (namespace && isExpression(namespace)) {
        namespace = getParentNamespaceOf(namespace);
    }
    return namespace;
}

/**
 * Gets visibility of a membership.
 * Returns 'public', 'private', or 'protected'.
 */
function getVisibility(membership: AstNode): string {
    const nodeAny = membership as any;
    return nodeAny.visibility ?? 'public';
}

/**
 * Creates an AstNodeDescription for a named element.
 */
function createDescription(name: string, node: AstNode): AstNodeDescription {
    return {
        name,
        node,
        type: node.$type,
        documentUri: getDocumentUri(node),
        path: getAstNodePath(node)
    };
}

/**
 * Collects owned members from a namespace.
 *
 * ALIAS-FIX: Added support for alias memberships (e.g., `alias temperature for thermodynamicTemperature`)
 * Aliases have memberName set to the alias name, and memberElement pointing to the target.
 */
function collectOwnedMembers(
    namespace: AstNode,
    isInsideScope: boolean,
    isInheriting: boolean,
    includeAll: boolean
): AstNodeDescription[] {
    const members: AstNodeDescription[] = [];
    const nodeAny = namespace as any;

    // Check ownedRelationship array (standard SysML pattern)
    const ownedRelationship = nodeAny.ownedRelationship;
    if (Array.isArray(ownedRelationship)) {
        for (const rel of ownedRelationship) {
            // Skip if already visited (cycle detection)
            if (isVisited(rel)) continue;

            // Check visibility
            const visibility = getVisibility(rel);
            if (!includeAll && !isInsideScope) {
                if (visibility !== 'public' && !(visibility === 'protected' && isInheriting)) {
                    continue;
                }
            }

            // Add to visited to prevent cycles
            addVisited(rel);

            // ALIAS-FIX: Check for alias pattern (memberName + memberElement reference)
            // Aliases like `alias temperature for thermodynamicTemperature` have:
            // - memberName = "temperature" (the alias name)
            // - memberElement = reference to thermodynamicTemperature (the target)
            const memberName = rel?.memberName;
            const memberShortName = rel?.memberShortName;
            if (memberName || memberShortName) {
                // This is likely an alias or explicit membership name
                const memberElementRef = rel?.memberElement;
                if (memberElementRef) {
                    // Resolve the referenced element
                    const resolvedElement = safeGetRef(memberElementRef);
                    if (resolvedElement) {
                        // Add alias name pointing to the resolved element
                        if (memberName) {
                            members.push(createDescription(memberName, resolvedElement));
                        }
                        if (memberShortName && memberShortName !== memberName) {
                            members.push(createDescription(memberShortName, resolvedElement));
                        }
                    } else {
                        // If not resolved yet, create description with the reference info
                        // The name will be used for lookup, pointing to the unresolved ref
                        if (memberName && memberElementRef.$refText) {
                            // Create a placeholder that can be resolved later
                            members.push({
                                name: memberName,
                                node: rel, // Point to the membership for now
                                type: 'Alias',
                                documentUri: getDocumentUri(rel),
                                path: getAstNodePath(rel)
                            });
                        }
                    }
                }
            }

            // Handle memberships that contain owned elements
            const ownedRelatedElement = rel?.ownedRelatedElement;
            if (Array.isArray(ownedRelatedElement)) {
                for (const elem of ownedRelatedElement) {
                    addMemberDescriptions(members, elem);
                }
            } else if (ownedRelatedElement && typeof ownedRelatedElement === 'object') {
                addMemberDescriptions(members, ownedRelatedElement);
            }

            // Also check memberElement for non-owning memberships (when no explicit memberName)
            // This handles cases where the element's own name should be used
            if (!memberName && !memberShortName) {
                const memberElement = rel?.memberElement;
                if (memberElement && typeof memberElement === 'object') {
                    const resolvedMember = safeGetRef(memberElement);
                    if (resolvedMember) {
                        addMemberDescriptions(members, resolvedMember);
                    }
                }
            }

            removeVisited(rel);
        }
    }

    // Also check ownedMember for some node types
    const ownedMember = nodeAny.ownedMember;
    if (Array.isArray(ownedMember)) {
        for (const member of ownedMember) {
            addMemberDescriptions(members, member);
        }
    }

    return members;
}

/**
 * Adds descriptions for both name and short name.
 */
function addMemberDescriptions(members: AstNodeDescription[], elem: AstNode): void {
    const name = getEffectiveName(elem);
    if (name && elem.$type) {
        members.push(createDescription(name, elem));
    }
    const shortName = getShortName(elem);
    if (shortName && shortName !== name && elem.$type) {
        members.push(createDescription(shortName, elem));
    }
}

/**
 * Safely gets the resolved reference without triggering new linking.
 * Returns undefined if the reference is not yet resolved.
 */
function safeGetRef(reference: any): AstNode | undefined {
    if (!reference) return undefined;

    // If it's already a direct AST node (no $refText), return it
    if (typeof reference === 'object' && !reference.$refText && reference.$type) {
        return reference;
    }

    // Check if the reference has been resolved (has _ref with actual node)
    // We check _ref directly to avoid triggering the getter which causes cycles
    if (reference._ref && reference._ref.ref) {
        return reference._ref.ref;
    }

    // Try accessing .ref but catch any cyclic resolution errors
    try {
        const ref = reference.ref;
        if (ref && typeof ref === 'object' && ref.$type) {
            return ref;
        }
    } catch {
        // Cyclic reference - skip this one
    }

    return undefined;
}

/**
 * Gets the general/supertype from a specialization relationship.
 * Handles different relationship types: Specialization, Subclassification, FeatureTyping
 */
function getGeneralFromSpecialization(spec: AstNode): AstNode | undefined {
    const specAny = spec as any;

    // Try different property names based on relationship type
    // Subclassification uses superclassifier
    const superclassifier = safeGetRef(specAny.superclassifier);
    if (superclassifier) return superclassifier;

    // FeatureTyping uses type
    const typeRef = safeGetRef(specAny.type);
    if (typeRef) return typeRef;

    // Specialization uses general
    const general = safeGetRef(specAny.general);
    if (general) return general;

    return undefined;
}

/**
 * Collects inherited members from generalizations.
 */
function collectGeneralizedMembers(
    type: AstNode,
    visitedTypes: Set<AstNode>,
    _isInheriting: boolean
): AstNodeDescription[] {
    const members: AstNodeDescription[] = [];

    if (!isType(type) || visitedTypes.has(type)) {
        return members;
    }
    visitedTypes.add(type);

    const typeAny = type as any;

    // Handle conjugation
    const conjugator = typeAny.ownedConjugator;
    if (conjugator && !isVisited(conjugator)) {
        addVisited(conjugator);
        const originalType = conjugator.originalType ?? conjugator.conjugatedType;
        if (originalType && !visitedTypes.has(originalType)) {
            const conjugatedMembers = collectOwnedMembers(originalType, false, true, false);
            members.push(...conjugatedMembers);
            const inherited = collectGeneralizedMembers(originalType, visitedTypes, true);
            members.push(...inherited);
        }
        removeVisited(conjugator);
    }

    // Handle specializations in ownedRelationship
    // This is where Subclassification, Specialization, etc. are stored
    const ownedRelationship = typeAny.ownedRelationship;
    if (Array.isArray(ownedRelationship)) {
        for (const rel of ownedRelationship) {
            const relType = rel.$type;
            if (relType === 'Subclassification' ||
                relType === 'Specialization' ||
                relType === 'Subsetting' ||
                relType === 'Redefinition' ||
                relType === 'FeatureTyping') {

                if (!isVisited(rel)) {
                    addVisited(rel);
                    const general = getGeneralFromSpecialization(rel);
                    if (general && !visitedTypes.has(general)) {
                        const generalMembers = collectOwnedMembers(general, false, true, false);
                        members.push(...generalMembers);
                        const inherited = collectGeneralizedMembers(general, visitedTypes, true);
                        members.push(...inherited);
                    }
                    removeVisited(rel);
                }
            }
        }
    }

    // Also check ownedSpecialization (legacy property)
    const ownedSpecialization = typeAny.ownedSpecialization;
    if (Array.isArray(ownedSpecialization)) {
        for (const spec of ownedSpecialization) {
            if (!isVisited(spec)) {
                addVisited(spec);
                const general = getGeneralFromSpecialization(spec);
                if (general && !visitedTypes.has(general)) {
                    const generalMembers = collectOwnedMembers(general, false, true, false);
                    members.push(...generalMembers);
                    const inherited = collectGeneralizedMembers(general, visitedTypes, true);
                    members.push(...inherited);
                }
                removeVisited(spec);
            }
        }
    }

    visitedTypes.delete(type);
    return members;
}

/**
 * LINK-002/003: Follow imports from a namespace to find an element.
 * Uses $refText to avoid triggering cross-reference resolution.
 *
 * When resolving ISQ::MassValue, ISQ has "public import ISQBase::*".
 * This function finds the import and recursively looks up ISQBase::MassValue.
 *
 * LINK-003 FIX: When doing qualified name resolution (e.g., Domain::X),
 * we're navigating INTO the namespace, so ALL imports (including private)
 * should be visible. Private imports only restrict external visibility,
 * not internal resolution.
 *
 * ALIAS-FIX: Also searches within the imported namespace's own members,
 * not just via qualified name lookup. This enables aliases to be found.
 */
function followImportsForElement(
    namespace: AstNode,
    elementName: string,
    globalScope: Scope,
    scopeProvider?: SysMLScopeProviderAdapter
): AstNodeDescription | undefined {
    const nodeAny = namespace as any;
    const ownedRelationship = nodeAny.ownedRelationship;

    if (!Array.isArray(ownedRelationship)) {
        return undefined;
    }

    // Find namespace imports (both public AND private)
    // LINK-003: When resolving Domain::X, we're inside Domain's scope,
    // so private imports are visible
    for (const rel of ownedRelationship) {
        if (rel.$type !== 'NamespaceImport') continue;

        // LINK-003: Removed visibility check - all imports are visible
        // when resolving through qualified names into the namespace

        // Get the imported namespace name from $refText
        const importedNamespaceRef = rel.importedNamespace;
        if (!importedNamespaceRef || !importedNamespaceRef.$refText) continue;

        const importedNamespaceName = importedNamespaceRef.$refText;

        // Method 1: Try looking up via qualified name in global index
        // E.g., if we're looking for "MassValue" and import is "ISQBase",
        // try looking up "ISQBase::MassValue" in the global index
        const qualifiedName = `${importedNamespaceName}::${elementName}`;
        let result = globalScope.getElement(qualifiedName);
        if (result) {
            return result;
        }

        // Method 2 (ALIAS-FIX): Resolve the imported namespace and search its members directly
        // This is necessary for aliases because they aren't indexed by qualified name
        if (scopeProvider) {
            // Try to resolve the imported namespace reference
            const importedNs = safeGetRef(importedNamespaceRef);
            if (importedNs && isNamespace(importedNs)) {
                // Collect members from the imported namespace (including aliases!)
                const members = collectOwnedMembers(importedNs, false, false, false);

                // Search for the element by name
                for (const member of members) {
                    if (member.name === elementName || normalizeUnrestrictedName(member.name) === elementName) {
                        return member;
                    }
                }

                // Also search inherited members (for types)
                if (isType(importedNs)) {
                    const inheritedMembers = collectGeneralizedMembers(importedNs, new Set(), true);
                    for (const member of inheritedMembers) {
                        if (member.name === elementName || normalizeUnrestrictedName(member.name) === elementName) {
                            return member;
                        }
                    }
                }

                // Recursively follow imports in the imported namespace
                result = followImportsForElement(importedNs, elementName, globalScope, scopeProvider);
                if (result) {
                    return result;
                }
            }
        }
    }

    return undefined;
}

/**
 * Collects imported members from imports.
 *
 * ALIAS-FIX: Now properly looks for NamespaceImport/MembershipImport in ownedRelationship
 * and uses safeGetRef to avoid circular resolution issues.
 */
function collectImportedMembers(
    namespace: AstNode,
    visitedNamespaces: Set<AstNode>,
    isInsideScope: boolean,
    includeAll: boolean
): AstNodeDescription[] {
    const members: AstNodeDescription[] = [];
    const nodeAny = namespace as any;

    // ALIAS-FIX: Imports are stored in ownedRelationship, not ownedImport
    const ownedRelationship = nodeAny.ownedRelationship;
    if (!Array.isArray(ownedRelationship)) {
        return members;
    }

    for (const rel of ownedRelationship) {
        // Only process import types
        if (rel.$type !== 'NamespaceImport' && rel.$type !== 'MembershipImport' && rel.$type !== 'Import') {
            continue;
        }

        if (isVisited(rel)) continue;

        // Check visibility
        const visibility = getVisibility(rel);
        if (!includeAll && !isInsideScope && visibility !== 'public') {
            continue;
        }

        addVisited(rel);

        // Handle namespace imports (import X::* or import X)
        if (rel.$type === 'NamespaceImport' || rel.$type === 'Import') {
            const importedNamespaceRef = rel.importedNamespace;
            if (importedNamespaceRef) {
                // Use safeGetRef to avoid circular resolution issues
                const importedNamespace = safeGetRef(importedNamespaceRef);
                if (importedNamespace && !visitedNamespaces.has(importedNamespace)) {
                    visitedNamespaces.add(importedNamespace);

                    // Collect members from the imported namespace
                    const importedMembers = collectOwnedMembers(importedNamespace, false, false, false);
                    members.push(...importedMembers);

                    // Handle recursive imports
                    if (rel.isRecursive) {
                        const recursiveMembers = collectRecursiveMembers(importedNamespace, visitedNamespaces);
                        members.push(...recursiveMembers);
                    }

                    // Also collect from inherited types if it's a Type
                    if (isType(importedNamespace)) {
                        const inheritedMembers = collectGeneralizedMembers(importedNamespace, new Set(), true);
                        members.push(...inheritedMembers);
                    }

                    // Recursively collect from imports within the imported namespace
                    const transitiveMembers = collectImportedMembers(importedNamespace, visitedNamespaces, false, false);
                    members.push(...transitiveMembers);

                    visitedNamespaces.delete(importedNamespace);
                }
            }
        }

        // Handle membership imports (import X::y)
        if (rel.$type === 'MembershipImport') {
            const importedMembershipRef = rel.importedMembership;
            if (importedMembershipRef) {
                const importedMembership = safeGetRef(importedMembershipRef);
                if (importedMembership) {
                    const memberElement = getMemberElement(importedMembership);
                    if (memberElement) {
                        addMemberDescriptions(members, memberElement);
                    }
                }
            }
        }

        removeVisited(rel);
    }

    return members;
}

/**
 * Collects members recursively for recursive imports.
 */
function collectRecursiveMembers(
    namespace: AstNode,
    visitedNamespaces: Set<AstNode>
): AstNodeDescription[] {
    const members: AstNodeDescription[] = [];
    const nodeAny = namespace as any;

    const ownedRelationship = nodeAny.ownedRelationship;
    if (!Array.isArray(ownedRelationship)) {
        return members;
    }

    for (const rel of ownedRelationship) {
        const visibility = getVisibility(rel);
        if (visibility !== 'public') continue;

        const memberElement = rel.ownedMemberElement ?? rel.memberElement;
        if (memberElement && isNamespace(memberElement) && !visitedNamespaces.has(memberElement)) {
            visitedNamespaces.add(memberElement);
            const nestedMembers = collectOwnedMembers(memberElement, false, false, false);
            members.push(...nestedMembers);
            const recursiveMembers = collectRecursiveMembers(memberElement, visitedNamespaces);
            members.push(...recursiveMembers);
            visitedNamespaces.delete(memberElement);
        }
    }

    return members;
}

/**
 * ADR-002: Parse a conjugated qualified name.
 *
 * For conjugated port references like ~TowelAlert_PortDef::UserPort:
 * 1. Detect the ~ prefix
 * 2. Strip it and parse the unconjugated name
 * 3. Return info needed to create synthetic ConjugatedPortDefinition
 *
 * Returns: { isConjugated: boolean, unconjugatedName: string, lastSegment: string }
 */
function parseConjugatedName(name: string): { isConjugated: boolean; unconjugatedName: string; lastSegment: string } {
    if (!name || !name.startsWith('~')) {
        const segments = parseQualifiedName(name);
        return {
            isConjugated: false,
            unconjugatedName: name,
            lastSegment: segments[segments.length - 1] || name
        };
    }

    // Strip the ~ prefix
    const unconjugatedName = name.substring(1).trim();
    const segments = parseQualifiedName(unconjugatedName);

    return {
        isConjugated: true,
        unconjugatedName,
        lastSegment: segments[segments.length - 1] || unconjugatedName
    };
}

/**
 * Check if a node is a PortDefinition (for conjugated port resolution).
 * ADR-002: Used to identify elements that can have conjugated forms.
 */
function isPortDefinition(node: AstNode): boolean {
    return node.$type === 'PortDefinition';
}

/**
 * Parse a qualified name into segments.
 *
 * Examples:
 *   "Natural" → ["Natural"]
 *   "ScalarValues::Natural" → ["ScalarValues", "Natural"]
 *   "$::Base::Anything" → ["$", "Base", "Anything"]
 */
function parseQualifiedName(qualifiedName: string): string[] {
    if (!qualifiedName || !qualifiedName.includes('::')) {
        return [qualifiedName];
    }

    const segments: string[] = [];
    let i = 0;
    let j = 0;
    const n = qualifiedName.length;
    let isInQuote = false;

    // Handle global scope prefix ($::)
    if (qualifiedName.startsWith('$::')) {
        segments.push('$');
        i = 3;
        j = 3;
    }

    // Parse segments separated by ::
    while (j < n) {
        const c = qualifiedName.charAt(j);

        if (c === "'" || c === '"') {
            isInQuote = !isInQuote;
        } else if (!isInQuote && c === ':' && j + 1 < n && qualifiedName.charAt(j + 1) === ':') {
            // Found :: separator
            if (j > i) {
                segments.push(qualifiedName.substring(i, j));
            }
            i = j + 2;
            j = i - 1;
        }
        j++;
    }

    // Add final segment
    if (i < n) {
        segments.push(qualifiedName.substring(i));
    }

    return segments;
}

/**
 * Creates a scope from a list of descriptions with outer scope fallback.
 * Enhanced to handle qualified name resolution.
 *
 * @param descriptions - Local scope elements
 * @param outerScope - Parent scope for fallback
 * @param scopeProvider - Optional scope provider for resolving nested namespaces
 */
function createScope(
    descriptions: AstNodeDescription[],
    outerScope?: Scope,
    scopeProvider?: SysMLScopeProviderAdapter
): Scope {
    // Build map with both original and normalized names for lookup
    const descMap = new Map<string, AstNodeDescription>();
    for (const desc of descriptions) {
        if (!descMap.has(desc.name)) {
            descMap.set(desc.name, desc);
        }
        // Also add normalized version if different
        const normalized = normalizeUnrestrictedName(desc.name);
        if (normalized !== desc.name && !descMap.has(normalized)) {
            descMap.set(normalized, desc);
        }
    }

    /**
     * Look up a name in the map, trying both original and normalized forms.
     */
    function lookupName(searchName: string): AstNodeDescription | undefined {
        // Try exact match first
        let result = descMap.get(searchName);
        if (result) return result;

        // Try normalized version
        const normalized = normalizeUnrestrictedName(searchName);
        if (normalized !== searchName) {
            result = descMap.get(normalized);
            if (result) return result;
        }

        return undefined;
    }

    return {
        getElement(name: string): AstNodeDescription | undefined {
            // ADR-002: Handle conjugated port references (~Type syntax)
            const conjugatedInfo = parseConjugatedName(name);

            if (conjugatedInfo.isConjugated) {
                // Look up the unconjugated name (e.g., TowelAlert_PortDef::UserPort)
                const unconjugatedResult = this.getElement(conjugatedInfo.unconjugatedName);

                if (unconjugatedResult) {
                    // Resolve the node to check if it's a PortDefinition
                    const node = scopeProvider ? scopeProvider.resolveNode(unconjugatedResult) : unconjugatedResult.node;

                    if (node && isPortDefinition(node)) {
                        // Return synthetic ConjugatedPortDefinition
                        return {
                            name: name,  // Keep the full ~qualified::name
                            node: node,  // Point to original PortDefinition for go-to-definition
                            type: 'ConjugatedPortDefinition',
                            documentUri: unconjugatedResult.documentUri,
                            path: unconjugatedResult.path
                        };
                    }
                }
                // If not a PortDefinition, fall through to normal lookup
            }

            // Parse qualified name into segments
            const segments = parseQualifiedName(name);

            if (segments.length === 1) {
                // Simple name - direct lookup with normalization
                const local = lookupName(name);
                if (local) return local;

                // Try outer scope with normalized name
                const normalized = normalizeUnrestrictedName(name);
                let outer = outerScope?.getElement(name);
                if (!outer && normalized !== name) {
                    outer = outerScope?.getElement(normalized);
                }
                return outer;
            }

            // Qualified name - resolve segment by segment
            const firstSegment = segments[0];
            const normalizedFirst = normalizeUnrestrictedName(firstSegment);

            // Handle global scope prefix ($)
            if (firstSegment === '$') {
                // For global scope, skip $ and search in outer scope
                const remainingName = segments.slice(1).join('::');
                return outerScope?.getElement(remainingName);
            }

            // Look up first segment (try both original and normalized)
            let current = lookupName(firstSegment);

            // CIRCULAR-IMPORT-FIX: For qualified names, prefer Package/Library over imported members
            // Example: Domain imports MiningFrigate::*, which brings PartDefinition MiningFrigate into scope.
            // When resolving "MiningFrigate::MiningFrigate", we want Package MiningFrigate, not the PartDef.
            // If local finds something that's NOT a Package/Library, search global scope for a Package.
            if (current && scopeProvider) {
                const localNode = scopeProvider.resolveNode(current);
                const localType = localNode?.$type;
                // If local match is NOT a package-like container, search global scope for a Package
                if (localType && !['Package', 'LibraryPackage', 'Namespace'].includes(localType)) {
                    // Try outer scope first, then global scope directly
                    let globalMatch = outerScope?.getElement(firstSegment);
                    if (!globalMatch) {
                        // Access global scope directly via scopeProvider
                        const globalScope = scopeProvider.getGlobalScopeForQualifiedNames();
                        if (globalScope) {
                            globalMatch = globalScope.getElement(firstSegment);
                        }
                    }
                    if (globalMatch) {
                        const globalNode = scopeProvider.resolveNode(globalMatch);
                        const globalType = globalNode?.$type;
                        // If global scope has a Package/Library, prefer that
                        if (globalType && ['Package', 'LibraryPackage'].includes(globalType)) {
                            current = globalMatch;
                        }
                    }
                }
            }

            if (!current) {
                current = outerScope?.getElement(firstSegment);
            }
            if (!current && normalizedFirst !== firstSegment) {
                current = outerScope?.getElement(normalizedFirst);
            }
            // CIRCULAR-IMPORT-FIX2: If outer scope returns non-Package, or fails entirely, try global scope directly
            // This handles cases where outer scope has an imported member that shadows the global package
            if (scopeProvider) {
                const currentNode = current ? scopeProvider.resolveNode(current) : undefined;
                const currentType = currentNode?.$type;
                const needsGlobalFallback = !current || (currentType && !['Package', 'LibraryPackage'].includes(currentType));

                if (needsGlobalFallback) {
                    const globalScope = scopeProvider.getGlobalScopeForQualifiedNames();
                    if (globalScope) {
                        const globalMatch = globalScope.getElement(firstSegment);
                        if (globalMatch) {
                            const globalNode = scopeProvider.resolveNode(globalMatch);
                            const globalType = globalNode?.$type;
                            // If global has a Package/Library, prefer that
                            if (globalType && ['Package', 'LibraryPackage'].includes(globalType)) {
                                current = globalMatch;
                            }
                        }
                    }
                }
            }

            if (!current) {
                return undefined;
            }

            // Resolve the node (might need to load from document)
            let node = scopeProvider ? scopeProvider.resolveNode(current) : current.node;
            if (!node) {
                return undefined;
            }

            // If the node is a Membership, unwrap it to get the actual element
            // This is needed because qualified name resolution needs to traverse
            // through namespaces, and Memberships are not namespaces themselves
            if (isMembership(node)) {
                const memberElement = getMemberElement(node);
                if (memberElement) {
                    node = memberElement;
                }
            }

            // Get scope for next segment resolution
            let nextScope: Scope | undefined;

            // For Features, first try to resolve through their types
            // E.g., binaryLinks::source → look for 'source' in BinaryLink type
            if (isFeature(node)) {
                const types = getFeatureTypes(node);
                if (types.length > 0) {
                    // Create combined scope from all types
                    const typeDescriptions: AstNodeDescription[] = [];
                    for (const type of types) {
                        if (isNamespace(type)) {
                            const typeScope = scopeProvider!.scopeFor(type, false, false, false);
                            for (const elem of typeScope.getAllElements()) {
                                typeDescriptions.push(elem);
                            }
                        }
                    }
                    if (typeDescriptions.length > 0) {
                        nextScope = createScope(typeDescriptions, undefined, scopeProvider);
                    }
                }
            }

            // If no type-based scope, try namespace scope
            if (!nextScope && isNamespace(node)) {
                nextScope = scopeProvider!.scopeFor(node, false, false, false);
            }

            if (!nextScope) {
                return undefined;
            }

            // Remaining name to look up
            const remainingName = segments.slice(1).join('::');

            // Try direct lookup first
            let result = nextScope.getElement(remainingName);
            if (result) {
                return result;
            }

            // LINK-002 FIX: If not found, try following imports
            // This handles patterns like ISQ::MassValue where ISQ has "public import ISQBase::*"
            // ALIAS-FIX: Pass scopeProvider to enable direct member lookup for aliases
            if (scopeProvider && isNamespace(node)) {
                result = followImportsForElement(node, remainingName, outerScope ?? this, scopeProvider);
                if (result) {
                    return result;
                }
            }

            // CIRCULAR-IMPORT-FIX: If local match failed to resolve qualified name, try outer scope
            // This handles cases where local scope has an imported member with same name as a package.
            // Example: Domain imports MiningFrigate::*, which imports the PartDefinition MiningFrigate.
            // When resolving "MiningFrigate::MiningFrigate", local finds PartDefinition but can't
            // resolve the second segment. Fall back to outer scope which finds the Package.
            if (outerScope && lookupName(firstSegment)) {
                // We had a local match that failed - try outer scope instead
                result = outerScope.getElement(name);
                if (result) {
                    return result;
                }
            }

            return undefined;
        },
        getElements(name: string): Stream<AstNodeDescription> {
            const element = this.getElement(name);
            return stream(element ? [element] : []);
        },
        getAllElements(): Stream<AstNodeDescription> {
            const localElements = Array.from(descMap.values());
            if (outerScope) {
                const outerElements: AstNodeDescription[] = [];
                for (const elem of outerScope.getAllElements()) {
                    if (!descMap.has(elem.name)) {
                        outerElements.push(elem);
                    }
                }
                return stream([...localElements, ...outerElements]);
            }
            return stream(localElements);
        }
    };
}

/**
 * SysML Scope Provider implementing Langium's ScopeProvider interface.
 *
 * Provides scope resolution for cross-references, enabling:
 * - Symbol completion
 * - Go-to-definition
 * - Find references
 */
export class SysMLScopeProviderAdapter implements ScopeProvider {
    /**
     * IndexManager for accessing global symbols from all documents.
     * This is critical for cross-file reference resolution.
     */
    private readonly indexManager: IndexManager;

    /**
     * LangiumDocuments for loading documents to resolve nodes.
     */
    private readonly langiumDocuments: LangiumDocuments;

    /**
     * AstNodeLocator for finding nodes within documents.
     */
    private readonly astNodeLocator: AstNodeLocator;

    constructor(services: LangiumCoreServices) {
        this.indexManager = services.shared.workspace.IndexManager;
        this.langiumDocuments = services.shared.workspace.LangiumDocuments;
        this.astNodeLocator = services.workspace.AstNodeLocator;
    }

    /**
     * Resolve an AST node from a description.
     * Used when the node is not directly available (e.g., from global index).
     */
    public resolveNode(description: AstNodeDescription): AstNode | undefined {
        // If node is already available, use it
        if (description.node) {
            return description.node;
        }

        // Try to resolve from document
        try {
            const document = this.langiumDocuments.getDocument(description.documentUri);
            if (document) {
                return this.astNodeLocator.getAstNode(document.parseResult.value, description.path);
            }
        } catch {
            // Document might not be loaded
        }

        return undefined;
    }

    /**
     * Returns a scope describing what elements are visible for the given reference context.
     *  (getScope method)
     *
     * Context cases:
     * 1. Conjugation → scope_owningNamespace (line 87-88)
     * 2. ReferenceSubsetting → connector-aware scope (lines 89-95)
     * 3. FeatureTyping → scope_nonExpressionNamespace (lines 96-97)
     * 4. Specialization → scope_owningNamespace (lines 98-99)
     * 5. FeatureChaining → scope_featureChaining (lines 100-101)
     * 6. Membership → scope_relativeNamespace (lines 102-103)
     * 7. Import → scope_Namespace (lines 104-105)
     * 8. Namespace → scopeFor (lines 106-107)
     * 9. Element → scope_owningNamespace (lines 108-109)
     */
    getScope(context: ReferenceInfo): Scope {
        try {
            clearVisited();
            const containerNode = context.container;
            const property = context.property;
            const containerType = containerNode.$type;

            // Case 1: Conjugation - line 87-88
            if (containerType === 'Conjugation') {
                return this.scope_owningNamespace(containerNode);
            }

            // Case 2: ReferenceSubsetting - lines 89-95
            if (containerType === 'ReferenceSubsetting' || containerType === 'Subsetting') {
                const nodeAny = containerNode as any;
                const referencingFeature = nodeAny.referencingFeature ?? nodeAny.subsettingFeature;
                const owningType = referencingFeature?.owningType;
                // If it's a connector end, use the connector's namespace
                if (referencingFeature?.isEnd && owningType?.$type === 'Connector') {
                    return this.scope_owningNamespace(owningType);
                }
                return this.scope_owningNamespace(containerNode);
            }

            // Case 3: FeatureTyping - lines 96-97
            if (containerType === 'FeatureTyping') {
                return this.scope_nonExpressionNamespace(containerNode);
            }

            // Case 4: Specialization (Subclassification, Subsetting, Redefinition) - lines 98-99
            if (containerType === 'Specialization' ||
                containerType === 'Subclassification' ||
                containerType === 'Redefinition') {
                return this.scope_owningNamespace(containerNode);
            }

            // Case 5: FeatureChaining - lines 100-101
            if (containerType === 'FeatureChaining') {
                return this.scope_featureChaining(containerNode);
            }

            // Case 6: Membership - lines 102-103
            if (containerType === 'Membership' || containerType === 'OwningMembership') {
                const nodeAny = containerNode as any;
                const membershipOwningNamespace = nodeAny.membershipOwningNamespace;
                return this.scope_relativeNamespace(containerNode, membershipOwningNamespace);
            }

            // Case 7: Import - lines 104-105
            if (containerType === 'Import' ||
                containerType === 'NamespaceImport' ||
                containerType === 'MembershipImport') {
                const nodeAny = containerNode as any;
                const importOwningNamespace = nodeAny.importOwningNamespace;
                return this.scope_Namespace(containerNode, importOwningNamespace, true);
            }

            // Case 8: Namespace - lines 106-107
            if (isNamespace(containerNode)) {
                return this.scopeFor(containerNode, true, true, false);
            }

            // Case 9: Default Element handling - lines 108-109
            // Also handle property-specific scoping
            if (property === 'ownedSubsetting' || property === 'ownedRedefinition' ||
                property === 'ownedTyping' || property === 'type') {
                return this.scope_nonExpressionNamespace(containerNode);
            }

            if (property === 'memberElement' || property === 'importedNamespace') {
                return this.getGlobalScope(containerNode);
            }

            // Default: traverse up collecting visible members
            return this.scope_owningNamespace(containerNode);

        } finally {
            clearVisited();
        }
    }

    /**
     * Scope for owning namespace.
     *  (scope_owningNamespace)
     */
    private scope_owningNamespace(element: AstNode): Scope {
        const namespace = getParentNamespaceOf(element);
        if (!namespace) {
            return EMPTY_SCOPE;
        }
        return this.scopeFor(namespace, true, true, false);
    }

    /**
     * Scope for non-expression namespace.
     *  (scope_nonExpressionNamespace)
     */
    private scope_nonExpressionNamespace(element: AstNode): Scope {
        const namespace = getNonExpressionNamespaceFor(element);
        if (!namespace) {
            return EMPTY_SCOPE;
        }
        return this.scopeFor(namespace, true, true, false);
    }

    /**
     * Scope for feature chaining.
     *  (scope_featureChaining)
     */
    private scope_featureChaining(chaining: AstNode): Scope {
        const chainingAny = chaining as any;
        const featureChained = chainingAny.featureChained;
        const ownedFeatureChainings = featureChained?.ownedFeatureChaining;

        if (!Array.isArray(ownedFeatureChainings)) {
            return this.scope_owningNamespace(chaining);
        }

        const index = ownedFeatureChainings.indexOf(chaining);
        if (index <= 0) {
            // First in chain: use owning namespace
            return this.scope_owningNamespace(chaining);
        }

        // Not first: scope from previous chaining feature
        const prevChaining = ownedFeatureChainings[index - 1];
        const prevFeature = prevChaining?.chainingFeature;
        if (prevFeature) {
            return this.scope_Namespace(chaining, prevFeature, false);
        }

        return this.scope_owningNamespace(chaining);
    }

    /**
     * Scope relative to a namespace.
     *  (scope_relativeNamespace)
     */
    private scope_relativeNamespace(element: AstNode, namespace: AstNode | undefined): Scope {
        if (!namespace) {
            return this.scope_nonExpressionNamespace(element);
        }
        return this.scopeFor(namespace, false, true, false);
    }

    /**
     * Scope from a specific namespace.
     *  (scope_Namespace)
     */
    private scope_Namespace(
        element: AstNode,
        namespace: AstNode | undefined,
        isInsideScope: boolean
    ): Scope {
        if (!namespace) {
            return this.getGlobalScope(element);
        }
        return this.scopeFor(namespace, isInsideScope, true, false);
    }

    /**
     * Main scope construction method.
     *  (scopeFor) and KerMLScope constructor
     *
     * Collects:
     * 1. Owned members (owned())
     * 2. Inherited members (gen())
     * 3. Imported members (imp())
     * 4. Parent namespace members (recursive)
     *
     * Made public to support qualified name resolution from within scopes.
     */
    public scopeFor(
        namespace: AstNode,
        isInsideScope: boolean,
        _isFirstScope: boolean,
        _isRedefinition: boolean
    ): Scope {
        const allMembers: AstNodeDescription[] = [];
        const visitedTypes = new Set<AstNode>();
        const visitedNamespaces = new Set<AstNode>();

        // 1. Collect owned members - ported from owned()
        const ownedMembers = collectOwnedMembers(namespace, isInsideScope, false, false);
        allMembers.push(...ownedMembers);

        // 2. Collect inherited members if this is a Type - ported from gen()
        if (isType(namespace)) {
            const inheritedMembers = collectGeneralizedMembers(namespace, visitedTypes, true);
            allMembers.push(...inheritedMembers);
        }

        // 3. Collect imported members - ported from imp()
        const importedMembers = collectImportedMembers(namespace, visitedNamespaces, isInsideScope, false);
        allMembers.push(...importedMembers);

        // 4. Build outer scope from parent namespace
        let outerScope: Scope | undefined;
        if (isInsideScope) {
            const parent = getParentNamespaceOf(namespace);
            if (parent) {
                outerScope = this.scopeFor(parent, true, false, false);
            } else {
                // Root - add global scope
                outerScope = this.getGlobalScope(namespace);
            }
        }

        // Pass 'this' to enable qualified name resolution in nested namespaces
        return createScope(allMembers, outerScope, this);
    }

    /**
     * Gets global scope for imports and qualified names.
     * Uses IndexManager to access symbols from ALL loaded documents (including stdlib).
     *
     * This is the critical fix: Without accessing the global index, cross-document
     * references like 'ScalarValues::Natural' cannot be resolved.
     *
     * Note: We don't cache the global scope because the index changes as documents
     * are built. Caching causes stale results during the build process.
     */
    private getGlobalScope(_node: AstNode, _referenceType?: string): Scope {
        return this.getGlobalScopeForQualifiedNames();
    }

    /**
     * CIRCULAR-IMPORT-FIX: Exposes global scope for qualified name resolution.
     * When local scope has an imported member that shadows a global package,
     * we need to access the global scope directly to find the package.
     */
    public getGlobalScopeForQualifiedNames(): Scope {
        // Create a lazy scope that reads from the index on demand
        // This ensures we always get the latest index contents
        const self = this;

        /**
         * Get type specificity score for Definition types.
         * Higher score = more specific type (preferred when there are collisions).
         *
         * LINK-001: SysML metamodel hierarchy for Definitions:
         * - UseCaseDefinition > CaseDefinition > CalculationDefinition > ActionDefinition
         * - RequirementDefinition > ConstraintDefinition
         * - StateDefinition > ActionDefinition
         * - (and others)
         *
         * When multiple definitions have the same name, prefer the more specific one.
         */
        function getDefinitionSpecificity(type: string): number {
            // Package types - highest priority (MNNG-021)
            if (type === 'Package' || type === 'LibraryPackage' || type === 'RootNamespace') {
                return 1000;
            }

            // Most specific Definition types (score 100+)
            if (type === 'UseCaseDefinition') return 104;
            if (type === 'CaseDefinition') return 103;
            if (type === 'CalculationDefinition') return 102;
            if (type === 'AnalysisCaseDefinition') return 103;
            if (type === 'VerificationCaseDefinition') return 103;

            // State-related (score 90+)
            if (type === 'StateDefinition') return 91;
            if (type === 'TransitionUsage') return 91;

            // Requirement-related (score 80+)
            if (type === 'RequirementDefinition') return 82;
            if (type === 'ConstraintDefinition') return 81;

            // Action/Behavior types (score 70+) - less specific than above
            if (type === 'ActionDefinition') return 70;
            if (type === 'FlowConnectionDefinition') return 71;

            // Part/Item types (score 60+)
            if (type === 'PartDefinition') return 61;
            if (type === 'ItemDefinition') return 60;
            if (type === 'ConnectionDefinition') return 62;
            if (type === 'InterfaceDefinition') return 63;
            if (type === 'PortDefinition') return 64;
            if (type === 'AllocationDefinition') return 65;

            // Attribute types (score 50+)
            if (type === 'AttributeDefinition') return 51;
            if (type === 'EnumerationDefinition') return 52;

            // LINK-005: KerML DataType (score 200+)
            // Stdlib types like Boolean, Integer, Real, String should win over
            // user-defined PartDefinition/PartUsage with the same name.
            // E.g., ScalarValues::Boolean (DataType) over Datatypes::Boolean (PartUsage)
            if (type === 'DataType') return 200;

            // Occurrence/View types (score 40+)
            if (type === 'OccurrenceDefinition') return 40;
            if (type === 'ViewDefinition') return 41;
            if (type === 'ViewpointDefinition') return 42;
            if (type === 'RenderingDefinition') return 43;

            // Other Definition types (score 30)
            if (type.endsWith('Definition')) return 30;

            // Usage types (score 20)
            if (type.endsWith('Usage')) return 20;

            // Default
            return 0;
        }

        /**
         * Look up a name in the index, trying both original and normalized forms.
         *
         * MNNG-021: When multiple entries have the same name (e.g., both
         * 'package Domain' and 'part def Domain' export as "Domain"), prefer
         * Package types over Definition types.
         *
         * LINK-001 FIX: When multiple Definition types have the same name, prefer
         * more specific types (e.g., UseCaseDefinition over ActionDefinition).
         * This handles GfSE's name collision where both action def and use case def
         * have the same name "WithstandIncomingDamage".
         */
        function lookupInIndex(searchName: string): AstNodeDescription | undefined {
            const normalized = normalizeUnrestrictedName(searchName);
            let bestMatch: AstNodeDescription | undefined;
            let bestScore = -1;

            for (const elem of self.indexManager.allElements()) {
                const nameMatches = elem.name === searchName ||
                    (normalized !== searchName && elem.name === normalized) ||
                    normalizeUnrestrictedName(elem.name) === normalized;

                if (nameMatches) {
                    const score = getDefinitionSpecificity(elem.type);

                    // MNNG-021: Package types have highest priority (score 1000)
                    // Return immediately if found
                    if (score >= 1000) {
                        return elem;
                    }

                    // LINK-001: Track best match by specificity score
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = elem;
                    }
                }
            }
            return bestMatch;
        }

        return {
            getElement(name: string): AstNodeDescription | undefined {
                // ADR-002: Handle conjugated port references (~Type syntax)
                const conjugatedInfo = parseConjugatedName(name);

                if (conjugatedInfo.isConjugated) {
                    // Look up the unconjugated name (e.g., TowelAlert_PortDef::UserPort)
                    const unconjugatedResult = this.getElement(conjugatedInfo.unconjugatedName);

                    if (unconjugatedResult) {
                        // Resolve the node to check if it's a PortDefinition
                        const node = self.resolveNode(unconjugatedResult);

                        if (node && isPortDefinition(node)) {
                            // Return synthetic ConjugatedPortDefinition
                            return {
                                name: name,  // Keep the full ~qualified::name
                                node: node,  // Point to original PortDefinition for go-to-definition
                                type: 'ConjugatedPortDefinition',
                                documentUri: unconjugatedResult.documentUri,
                                path: unconjugatedResult.path
                            };
                        }
                    }
                    // If not a PortDefinition, fall through to normal lookup
                }

                // Parse qualified name into segments
                const segments = parseQualifiedName(name);

                if (segments.length === 1) {
                    // Simple name - search in index with normalization
                    return lookupInIndex(name);
                }

                // Qualified name - resolve segment by segment
                const firstSegment = segments[0];

                // Handle global scope prefix ($)
                if (firstSegment === '$') {
                    const remainingName = segments.slice(1).join('::');
                    return this.getElement(remainingName);
                }

                // Look up first segment in index
                const current = lookupInIndex(firstSegment);

                if (!current) {
                    return undefined;
                }

                // Resolve the node (might need to load from document)
                let node = self.resolveNode(current);
                if (!node) {
                    return undefined;
                }

                // If the node is a Membership, unwrap it to get the actual element
                // This is needed because qualified name resolution needs to traverse
                // through namespaces, and Memberships are not namespaces themselves
                if (isMembership(node)) {
                    const memberElement = getMemberElement(node);
                    if (memberElement) {
                        node = memberElement;
                    }
                }

                // Get scope for next segment resolution
                let nextScope: Scope | undefined;

                // For Features, first try to resolve through their types
                // E.g., binaryLinks::source → look for 'source' in BinaryLink type
                if (isFeature(node)) {
                    const types = getFeatureTypes(node);
                    if (types.length > 0) {
                        // Create combined scope from all types
                        const typeDescriptions: AstNodeDescription[] = [];
                        for (const type of types) {
                            if (isNamespace(type)) {
                                const typeScope = self.scopeFor(type, false, false, false);
                                for (const elem of typeScope.getAllElements()) {
                                    typeDescriptions.push(elem);
                                }
                            }
                        }
                        if (typeDescriptions.length > 0) {
                            nextScope = createScope(typeDescriptions, undefined, self);
                        }
                    }
                }

                // If no type-based scope, try namespace scope
                if (!nextScope && isNamespace(node)) {
                    nextScope = self.scopeFor(node, false, false, false);
                }

                if (!nextScope) {
                    return undefined;
                }

                // Remaining name to look up
                const remainingName = segments.slice(1).join('::');

                // Try direct lookup first
                let result = nextScope.getElement(remainingName);
                if (result) {
                    return result;
                }

                // LINK-002 FIX: If not found, try following imports
                // This handles patterns like ISQ::MassValue where ISQ has "public import ISQBase::*"
                // We follow imports by text (using $refText) to avoid circular reference issues
                // ALIAS-FIX: Pass self (scopeProvider) to enable direct member lookup for aliases
                result = followImportsForElement(node, remainingName, this, self);
                if (result) {
                    return result;
                }

                return undefined;
            },
            getElements(name: string): Stream<AstNodeDescription> {
                const element = this.getElement(name);
                return stream(element ? [element] : []);
            },
            getAllElements(): Stream<AstNodeDescription> {
                // Collect all elements from the index
                const allElements: AstNodeDescription[] = [];
                for (const elem of self.indexManager.allElements()) {
                    allElements.push(elem);
                }
                return stream(allElements);
            }
        };
    }

}

/**
 * Factory function to create the SysML scope provider.
 */
export function createSysMLScopeProvider(services: LangiumCoreServices): ScopeProvider {
    return new SysMLScopeProviderAdapter(services);
}
