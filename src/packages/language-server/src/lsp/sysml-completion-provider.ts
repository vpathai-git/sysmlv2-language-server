/**
 * SysML Completion Provider
 *
 * LSP-004: Context-aware code completion with keywords, symbols, and snippets.
 *
 * Rationale: Custom implementation following Langium patterns.
 * This implementation provides 21 snippet templates and extends Langium's
 * DefaultCompletionProvider per https://langium.org/docs/reference/completion/
 */

import type { LangiumServices } from 'langium/lsp';
import { DefaultCompletionProvider } from 'langium/lsp';
import { CompletionItemKind, InsertTextFormat, CompletionList, CancellationToken } from 'vscode-languageserver';
import type { CompletionItem, CompletionParams } from 'vscode-languageserver';
import type { LangiumDocument } from 'langium';

/**
 * SysML-specific snippet templates for common patterns.
 */
interface SnippetTemplate {
    label: string;
    insertText: string;
    detail: string;
    documentation: string;
    context: string[];  // Node types where this snippet is valid
}

const SYSML_SNIPPETS: SnippetTemplate[] = [
    // Package-level definitions
    {
        label: 'package',
        insertText: 'package ${1:Name} {\n\t$0\n}',
        detail: 'Package definition',
        documentation: 'Creates a new SysML package to organize model elements.',
        context: ['RootNamespace', 'Package']
    },
    {
        label: 'part def',
        insertText: 'part def ${1:Name} {\n\t$0\n}',
        detail: 'Part definition',
        documentation: 'Defines a reusable part type.',
        context: ['RootNamespace', 'Package', 'PartDefinition']
    },
    {
        label: 'action def',
        insertText: 'action def ${1:Name} {\n\t$0\n}',
        detail: 'Action definition',
        documentation: 'Defines a reusable action (behavior) type.',
        context: ['RootNamespace', 'Package']
    },
    {
        label: 'attribute def',
        insertText: 'attribute def ${1:Name} {\n\t$0\n}',
        detail: 'Attribute definition',
        documentation: 'Defines a reusable attribute (value) type.',
        context: ['RootNamespace', 'Package']
    },
    {
        label: 'item def',
        insertText: 'item def ${1:Name} {\n\t$0\n}',
        detail: 'Item definition',
        documentation: 'Defines a reusable item type.',
        context: ['RootNamespace', 'Package']
    },
    {
        label: 'port def',
        insertText: 'port def ${1:Name} {\n\t$0\n}',
        detail: 'Port definition',
        documentation: 'Defines a reusable port type for connections.',
        context: ['RootNamespace', 'Package']
    },
    {
        label: 'connection def',
        insertText: 'connection def ${1:Name} {\n\tend ${2:source};\n\tend ${3:target};\n}',
        detail: 'Connection definition',
        documentation: 'Defines a reusable connection type between ports.',
        context: ['RootNamespace', 'Package']
    },
    {
        label: 'interface def',
        insertText: 'interface def ${1:Name} {\n\t$0\n}',
        detail: 'Interface definition',
        documentation: 'Defines a reusable interface type.',
        context: ['RootNamespace', 'Package']
    },
    {
        label: 'requirement def',
        insertText: 'requirement def ${1:Name} {\n\tdoc /* ${2:description} */\n\t$0\n}',
        detail: 'Requirement definition',
        documentation: 'Defines a reusable requirement type.',
        context: ['RootNamespace', 'Package']
    },
    {
        label: 'state def',
        insertText: 'state def ${1:Name} {\n\t$0\n}',
        detail: 'State definition',
        documentation: 'Defines a reusable state machine type.',
        context: ['RootNamespace', 'Package']
    },

    // Usages (inside definitions)
    {
        label: 'part usage',
        insertText: 'part ${1:name} : ${2:Type};',
        detail: 'Part usage',
        documentation: 'Creates an instance of a part definition.',
        context: ['PartDefinition', 'ItemDefinition', 'Package']
    },
    {
        label: 'action usage',
        insertText: 'action ${1:name} : ${2:Type};',
        detail: 'Action usage',
        documentation: 'Creates an instance of an action definition.',
        context: ['ActionDefinition', 'PartDefinition', 'Package']
    },
    {
        label: 'attribute usage',
        insertText: 'attribute ${1:name} : ${2:Type};',
        detail: 'Attribute usage',
        documentation: 'Adds an attribute to this element.',
        context: ['PartDefinition', 'ItemDefinition', 'AttributeDefinition', 'Package']
    },
    {
        label: 'port usage',
        insertText: 'port ${1:name} : ${2:PortType};',
        detail: 'Port usage',
        documentation: 'Adds a port for connections.',
        context: ['PartDefinition', 'PortDefinition']
    },

    // Requirements
    {
        label: 'requirement usage',
        insertText: 'requirement ${1:name} {\n\tdoc /* ${2:text} */\n}',
        detail: 'Requirement usage',
        documentation: 'Creates a requirement instance.',
        context: ['Package', 'RequirementDefinition']
    },

    // State machines
    {
        label: 'state usage',
        insertText: 'state ${1:name} {\n\t$0\n}',
        detail: 'State usage',
        documentation: 'Adds a state to a state machine.',
        context: ['StateDefinition', 'StateUsage']
    },
    {
        label: 'transition',
        insertText: 'transition ${1:name} first ${2:source} then ${3:target};',
        detail: 'Transition',
        documentation: 'Adds a transition between states.',
        context: ['StateDefinition', 'StateUsage']
    },

    // Imports
    {
        label: 'import all',
        insertText: 'import ${1:QualifiedName}::*;',
        detail: 'Import all',
        documentation: 'Imports all public members from a namespace.',
        context: ['RootNamespace', 'Package']
    },
    {
        label: 'import single',
        insertText: 'import ${1:QualifiedName}::${2:Element};',
        detail: 'Import single element',
        documentation: 'Imports a specific element from a namespace.',
        context: ['RootNamespace', 'Package']
    },

    // Common patterns
    {
        label: 'doc',
        insertText: 'doc /* ${1:documentation} */',
        detail: 'Documentation',
        documentation: 'Adds documentation to an element.',
        context: ['PartDefinition', 'ActionDefinition', 'RequirementDefinition', 'Package']
    },
];

/**
 * SysML Completion Provider extending Langium's default.
 * Adds snippet completions for common SysML patterns.
 */
export class SysMLCompletionProvider extends DefaultCompletionProvider {
    constructor(services: LangiumServices) {
        super(services);
    }

    /**
     * Override getCompletion to add snippet completions to the result.
     */
    override async getCompletion(
        document: LangiumDocument,
        params: CompletionParams,
        cancelToken?: CancellationToken
    ): Promise<CompletionList | undefined> {
        // Get default completions
        const result = await super.getCompletion(document, params, cancelToken);

        if (!result) {
            return result;
        }

        // Add snippet completions based on context
        const snippetItems = this.getSnippetCompletions(document, params);
        result.items = [...snippetItems, ...result.items];

        return result;
    }

    /**
     * Gets snippet completions based on the current context.
     */
    private getSnippetCompletions(document: LangiumDocument, _params: CompletionParams): CompletionItem[] {
        const items: CompletionItem[] = [];
        const addedLabels = new Set<string>();

        // Get the container node type at the cursor position
        const root = document.parseResult?.value;
        const containerType = root?.$type;

        for (const snippet of SYSML_SNIPPETS) {
            // Check if snippet is valid in current context and not already added
            if (!addedLabels.has(snippet.label) &&
                (!containerType || snippet.context.includes(containerType) || snippet.context.length === 0)) {
                addedLabels.add(snippet.label);
                items.push({
                    label: snippet.label,
                    kind: CompletionItemKind.Snippet,
                    insertText: snippet.insertText,
                    insertTextFormat: InsertTextFormat.Snippet,
                    detail: snippet.detail,
                    documentation: snippet.documentation,
                    sortText: `0_${snippet.label}` // Sort snippets first
                });
            }
        }

        return items;
    }
}

/**
 * Factory function to create the completion provider.
 */
export function createSysMLCompletionProvider(services: LangiumServices): SysMLCompletionProvider {
    return new SysMLCompletionProvider(services);
}
