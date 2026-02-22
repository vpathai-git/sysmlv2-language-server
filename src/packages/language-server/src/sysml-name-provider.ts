/**
 * SysML Name Provider
 *
 * Custom NameProvider that handles SysML's naming conventions.
 * SysML uses 'declaredName' and 'declaredShortName' instead of just 'name'.
 *
 * Rationale: Correctly maps SysML naming conventions to Langium's NameProvider
 * interface per SysML v2 specification naming rules.
 */

import type { AstNode, NameProvider, CstNode } from 'langium';
import { GrammarUtils } from 'langium';

/**
 * Custom NameProvider for SysML/KerML that handles:
 * - declaredName (primary name)
 * - declaredShortName (alias)
 * - name (fallback for generated code)
 */
export class SysMLNameProvider implements NameProvider {
    /**
     * Gets the name of an AST node.
     * Checks declaredName first (SysML pattern), then name (fallback).
     */
    getName(node: AstNode): string | undefined {
        try {
            if (!node) return undefined;
            const nodeAny = node as any;

            // Primary: declaredName (SysML standard)
            if (nodeAny.declaredName && typeof nodeAny.declaredName === 'string') {
                return nodeAny.declaredName;
            }

            // Fallback: name (some generated nodes use this)
            if (nodeAny.name && typeof nodeAny.name === 'string') {
                return nodeAny.name;
            }

            // For Membership elements, check memberName
            if (nodeAny.memberName && typeof nodeAny.memberName === 'string') {
                return nodeAny.memberName;
            }

            return undefined;
        } catch (err) {
            console.error('[SysML] NameProvider.getName error:', err);
            return undefined;
        }
    }

    /**
     * Gets the CST node containing the name.
     * Used for highlighting, go-to-definition, etc.
     */
    getNameNode(node: AstNode): CstNode | undefined {
        try {
            if (!node || !node.$cstNode) return undefined;

            // Try declaredName first (SysML pattern)
            let nameNode = GrammarUtils.findNodeForProperty(node.$cstNode, 'declaredName');
            if (nameNode) {
                return nameNode;
            }

            // Try name (fallback)
            nameNode = GrammarUtils.findNodeForProperty(node.$cstNode, 'name');
            if (nameNode) {
                return nameNode;
            }

            // Try memberName (for Memberships)
            nameNode = GrammarUtils.findNodeForProperty(node.$cstNode, 'memberName');
            return nameNode;
        } catch (err) {
            console.error('[SysML] NameProvider.getNameNode error:', err);
            return undefined;
        }
    }
}

/**
 * Factory function to create SysML name provider.
 */
export function createSysMLNameProvider(): NameProvider {
    return new SysMLNameProvider();
}
