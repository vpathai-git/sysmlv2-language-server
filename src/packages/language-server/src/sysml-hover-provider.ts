/**
 * SysML Hover Provider
 *
 * Provides hover information for SysML elements with fallback support
 * when cross-references are not yet indexed.
 *
 * Rationale: Custom implementation following Langium best practices from:
 * https://langium.org/docs/reference/hover/
 *
 * Enhanced with KerML v1.0 specification references
 */

import { AstNode, CstUtils, MaybePromise } from 'langium';
import type { LangiumServices } from 'langium/lsp';
import { Hover, HoverParams } from 'vscode-languageserver';
import { AstNodeHoverProvider } from 'langium/lsp';
// import { getSpecForFeature, formatSpecReference } from './kerml-spec-references.js';

export class SysMLHoverProvider extends AstNodeHoverProvider {

    constructor(services: LangiumServices) {
        super(services);
    }

    /**
     * Provide hover content with fallback for unindexed references
     */
    override async getHoverContent(document: any, params: HoverParams): Promise<Hover | undefined> {
        try {
            // Use fast fallback approach - don't wait for default implementation
            // This prevents "loading..." from hanging
            return this.getFallbackHover(document, params);

        } catch (error) {
            // On error, return undefined to avoid hanging
            return undefined;
        }
    }

    /**
     * Get AST node hover content
     */
    protected override getAstNodeHoverContent(node: AstNode): MaybePromise<string | undefined> {
        try {
            // Fallback: show basic node information
            return this.getBasicNodeMarkdown(node);
        } catch {
            return this.getBasicNodeMarkdown(node);
        }
    }

    private getBasicNodeMarkdown(node: AstNode): string | undefined {
        const hoverResult = this.getBasicNodeInfo(node);
        if (!hoverResult) return undefined;
        const contents = hoverResult.contents;
        if (typeof contents === 'string') return contents;
        if ('value' in contents) return contents.value;
        return undefined;
    }

    /**
     * Fallback hover when references are not indexed yet
     */
    private getFallbackHover(document: any, params: HoverParams): Hover | undefined {
        try {
            const rootNode = document.parseResult?.value?.$cstNode;
            if (!rootNode) {
                return undefined;
            }

            const offset = document.textDocument.offsetAt(params.position);
            const cstNode = CstUtils.findLeafNodeAtOffset(rootNode, offset);

            if (!cstNode) {
                return undefined;
            }

            const astNode = cstNode.astNode;
            if (!astNode) {
                return undefined;
            }

            return this.getBasicNodeInfo(astNode);
        } catch {
            return undefined;
        }
    }

    /**
     * Get basic information about an AST node
     */
    private getBasicNodeInfo(node: AstNode): Hover | undefined {
        const nodeType = node.$type || 'Unknown';
        const nodeName = this.getNodeName(node);

        const lines: string[] = [];

        if (nodeName) {
            lines.push(`**${nodeName}**`);
            lines.push('');
        }

        lines.push(`*Type:* ${nodeType}`);

        // Add KerML spec reference if available
        const specRef = this.getKerMLSpecReference(nodeType);
        if (specRef) {
            lines.push('');
            lines.push(`*Spec:* ${specRef}`);
        }

        // Add additional properties if available
        const additionalInfo = this.getAdditionalInfo(node);
        if (additionalInfo) {
            lines.push('');
            lines.push(additionalInfo);
        }

        // Add documentation if available
        const docInfo = this.getDocumentation(node);
        if (docInfo) {
            lines.push('');
            lines.push('---');
            lines.push('');
            lines.push(docInfo);
        }

        return {
            contents: {
                kind: 'markdown',
                value: lines.join('\n')
            }
        };
    }

    /**
     * Extract name from AST node
     */
    private getNodeName(node: AstNode): string | undefined {
        // Try common name properties
        const nameProps = ['name', 'declaredName', 'shortName', 'identifier'];

        for (const prop of nameProps) {
            const value = (node as any)[prop];
            if (typeof value === 'string' && value.length > 0) {
                return value;
            }
        }

        return undefined;
    }

    /**
     * Get additional information about the node
     */
    private getAdditionalInfo(node: AstNode): string | undefined {
        const info: string[] = [];

        // Check for common SysML properties
        const props = node as any;

        if (props.visibility) {
            info.push(`Visibility: ${props.visibility}`);
        }

        if (props.isAbstract) {
            info.push('Abstract');
        }

        if (props.isSufficient) {
            info.push('Sufficient');
        }

        if (props.multiplicity) {
            info.push(`Multiplicity: ${this.formatMultiplicity(props.multiplicity)}`);
        }

        // Show container information
        const container = node.$container;

        if (container) {
            const containerName = this.getNodeName(container);
            const containerType = container.$type;
            if (containerName) {
                info.push(`Container: ${containerName} (${containerType})`);
            }
        }

        return info.length > 0 ? info.join(' • ') : undefined;
    }

    /**
     * Format multiplicity for display
     */
    private formatMultiplicity(mult: any): string {
        if (typeof mult === 'object') {
            const lower = mult.lower ?? '*';
            const upper = mult.upper ?? '*';
            if (lower === upper) {
                return String(lower);
            }
            return `${lower}..${upper}`;
        }
        return String(mult);
    }

    /**
     * Get KerML specification reference for a node type
     */
    private getKerMLSpecReference(_nodeType: string): string | undefined {
        return undefined;
        /*
        // Map AST node types to KerML features
        const featureType = this.nodeTypeToFeature(_nodeType);
        if (!featureType) {
            return undefined;
        }

        const spec = getSpecForFeature(featureType);
        if (!spec) {
            return undefined;
        }

        return `${formatSpecReference(featureType)} - ${spec.description}`;
        */
    }

    /**
     * Map AST node type to KerML feature name
     */
    /*
    private nodeTypeToFeature(nodeType: string): string | undefined {
        // Normalize node type to feature name
        const normalized = nodeType.toLowerCase();

        // Direct mappings
        const directMappings: Record<string, string> = {
            'classifier': 'classifier',
            'datatype': 'datatype',
            'class': 'class',
            'structure': 'structure',
            'feature': 'feature',
            'association': 'association',
            'connector': 'connector',
            'behavior': 'behavior',
            'function': 'function',
            'sysmlfunction': 'function',
            'predicate': 'predicate',
            'occurrence': 'occurrence',
            'package': 'package',
            'librarypackage': 'package',
            'namespace': 'namespace',
            'multiplicity': 'multiplicity',
            'featurevalue': 'featurevalue',
            'expression': 'expression',
            'specialization': 'specialization',
            'conjugation': 'conjugation',
            'subsetting': 'subsetting',
            'redefinition': 'redefinition',
            'binding': 'binding',
            'step': 'step',
            'interaction': 'interaction',
            'lifeclass': 'lifeclass'
        };

        return directMappings[normalized];
    }
    */

    /**
     * Extract documentation from node
     */
    private getDocumentation(node: AstNode): string | undefined {
        const props = node as any;

        // Check for documentation property
        if (props.doc && typeof props.doc === 'string') {
            return this.formatDocComment(props.doc);
        }

        // Check for comment property
        if (props.comment && typeof props.comment === 'string') {
            return this.formatDocComment(props.comment);
        }

        // Check for description property
        if (props.description && typeof props.description === 'string') {
            return this.formatDocComment(props.description);
        }

        return undefined;
    }

    /**
     * Format a documentation comment for display
     */
    private formatDocComment(comment: string): string {
        // Remove comment markers
        let formatted = comment
            .replace(/^\/\*\*?|\*\/$/g, '') // Remove /** and */
            .replace(/^\s*\*\s?/gm, '')      // Remove leading * on each line
            .trim();

        return formatted;
    }
}
