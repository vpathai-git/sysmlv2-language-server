/**
 * SysML Document Symbol Provider
 *
 * Wraps Langium's DefaultDocumentSymbolProvider with error handling
 * to prevent LSP request failures from crashing the language server.
 */

import type { DocumentSymbol, DocumentSymbolParams, CancellationToken } from 'vscode-languageserver';
import type { MaybePromise, LangiumDocument } from 'langium';
import { DefaultDocumentSymbolProvider } from 'langium/lsp';
import type { LangiumServices } from 'langium/lsp';

/**
 * Safe document symbol provider that catches and logs errors
 */
export class SysMLDocumentSymbolProvider extends DefaultDocumentSymbolProvider {
    constructor(services: LangiumServices) {
        super(services);
    }

    override getSymbols(
        document: LangiumDocument,
        params: DocumentSymbolParams,
        cancelToken?: CancellationToken
    ): MaybePromise<DocumentSymbol[]> {
        try {
            // Check if document has valid parse result
            if (!document.parseResult?.value) {
                console.warn(`[SysML] DocumentSymbol: No parse result for ${document.uri.toString()}`);
                return [];
            }

            return super.getSymbols(document, params, cancelToken);
        } catch (err) {
            console.error('[SysML] DocumentSymbol error:', err);
            return [];
        }
    }
}

/**
 * Factory function for creating the document symbol provider.
 */
export function createSysMLDocumentSymbolProvider(services: LangiumServices): SysMLDocumentSymbolProvider {
    return new SysMLDocumentSymbolProvider(services);
}
