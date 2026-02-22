/**
 * Filtering Document Validator
 *
 * Extends Langium's default DocumentValidator to apply cascade error filtering.
 * This provides a better user experience by removing spurious secondary errors.
 *
 * Rationale: Langium integration layer that applies cascade filtering from
 * diagnostic-filter.ts. Follows Langium patterns for custom document validators:
 * https://langium.org/docs/reference/validation/
 */

import { DefaultDocumentValidator } from 'langium';
import type { LangiumDocument, ValidationOptions, LangiumCoreServices } from 'langium';
import type { Diagnostic } from 'vscode-languageserver';
import { filterDiagnostics } from './diagnostic-filter.js';
import { isStandardLibraryDocument } from '../workspace-manager.js';

/**
 * Custom Document Validator with cascade error filtering
 *
 * This validator wraps the default Langium validator and applies intelligent
 * filtering to remove cascade/secondary errors that confuse users.
 *
 * Based on industry best practices from TypeScript, Rust Analyzer, and Pylance.
 */
export class FilteringDocumentValidator extends DefaultDocumentValidator {
    /**
     * Enable/disable cascade error filtering
     * Can be configured via environment variable: SYSML_DISABLE_CASCADE_FILTERING=true
     */
    private filteringEnabled: boolean;

    constructor(services: LangiumCoreServices) {
        super(services);

        // Check environment variables for configuration
        this.filteringEnabled = process.env.SYSML_DISABLE_CASCADE_FILTERING !== 'true';
    }

    /**
     * Validate document and filter cascade errors
     *
     * This method wraps the default validation and applies cascade filtering
     * to the resulting diagnostics before returning them to the IDE.
     *
     * Standard library documents are skipped entirely - they have expected
     * linking errors from incomplete dependency chains that shouldn't be
     * shown to users.
     */
    async validateDocument(
        document: LangiumDocument,
        options: ValidationOptions = {}
    ): Promise<Diagnostic[]> {
        // Skip validation for standard library documents
        // These have expected linking errors from incomplete dependencies
        if (isStandardLibraryDocument(document)) {
            return [];
        }

        // Get diagnostics from default validator
        const diagnostics = await super.validateDocument(document, options);

        // Apply cascade filtering
        const filtered = filterDiagnostics(diagnostics, {
            enableFiltering: this.filteringEnabled,
            addNotes: false
        });

        return filtered;
    }
}

/**
 * Factory function to create filtering document validator
 *
 * This is used in the DI module configuration
 */
export function createFilteringDocumentValidator(services: LangiumCoreServices): FilteringDocumentValidator {
    return new FilteringDocumentValidator(services);
}
