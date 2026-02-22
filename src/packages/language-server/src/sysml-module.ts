/**
 * SysML Language Module
 *
 * This module configures and provides all the language services
 * for SysML v2, including validation, completion, navigation, etc.
 *
 * LSP Feature Status:
 * - LSP-001: Langium 3.x API Migration - COMPLETED
 * - LSP-002: Scope Provider - ENABLED (GRAM-009 fixed circular type hierarchy)
 * - LSP-003: Validation Filtering - COMPLETED (stdlib filtered, cascade errors filtered)
 * - LSP-004: Completion Provider - TODO
 */

import type { LangiumSharedServices, DefaultSharedModuleContext } from 'langium/lsp';
import type { LangiumCoreServices } from 'langium';
import { createDefaultModule, createDefaultSharedModule } from 'langium/lsp';
import { inject, type Module, DocumentState } from 'langium';
import {
    SysMLGeneratedModule,
    SysMLGeneratedSharedModule,
    KerMLGeneratedModule,
    SysMLLanguageMetaData,
    KerMLLanguageMetaData
} from '@sysml/grammar';
import { augmentAst } from '@sysml/core';
import { SysMLWorkspaceManager } from './workspace-manager.js';

/**
 * Production mode LanguageMetaData - suppresses Chevrotain parser warnings
 *
 * In development mode, Chevrotain logs "Ambiguous Alternatives" warnings
 * for every parser construction. These are expected for our grammar and
 * create noise in the output. Production mode disables these validations.
 */
const SysMLProductionMetaData = {
    ...SysMLLanguageMetaData,
    mode: 'production' as const
};

const KerMLProductionMetaData = {
    ...KerMLLanguageMetaData,
    mode: 'production' as const
};
import { createSysMLScopeProvider } from './adapters/scope-adapter.js';
import { SysMLParserErrorMessageProvider, ENABLE_SIMPLIFIED_DIAGNOSTICS } from './sysml-diagnostic-provider.js';
import { createSysMLNameProvider } from './sysml-name-provider.js';
import { createSysMLScopeComputation } from './sysml-scope-computation.js';
import { createFilteringDocumentValidator } from './validation/filtering-document-validator.js';
import { createSysMLDocumentSymbolProvider } from './sysml-document-symbol-provider.js';
import { createSysMLLangiumDocuments } from './sysml-documents.js';
import { registerSysMLValidationChecks } from './validation/sysml-langium-validator.js';

/**
 * Combined SysML/KerML language services
 */
export type SysMLServices = LangiumCoreServices;
export type KerMLServices = LangiumCoreServices;

/**
 * Create SysML and KerML language services
 *
 * GRAM-008: Dual Language Architecture
 * - SysML grammar for .sysml files (no 'var' keyword)
 * - KerML grammar for .kerml files (with 'var' keyword)
 */
export function createSysMLServices(context: DefaultSharedModuleContext): {
    shared: LangiumSharedServices;
    SysML: SysMLServices;
    KerML: KerMLServices;
} {
    const shared = inject(
        createDefaultSharedModule(context),
        SysMLGeneratedSharedModule,
        SysMLSharedModule
    );

    // Create SysML services for .sysml files
    const SysML = inject(
        createDefaultModule({ shared }),
        SysMLGeneratedModule,
        SysMLModule
    );

    // Create KerML services for .kerml files
    // Uses KerMLGeneratedModule which has 'var' as a keyword
    const KerML = inject(
        createDefaultModule({ shared }),
        KerMLGeneratedModule,
        KerMLModule
    );

    // Register both languages with the shared service registry
    shared.ServiceRegistry.register(SysML);
    shared.ServiceRegistry.register(KerML);

    // Register validation checks
    const registry = SysML.validation.ValidationRegistry;
    registry.register(registerSysMLValidationChecks(SysML));

    // Register AST augmenter to run after parsing for both languages
    shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Parsed, (documents) => {
        for (const doc of documents) {
            augmentAst(doc);
        }
    });

    return { shared, SysML, KerML };
}

/**
 * Custom shared module for SysML-specific services
 */
export const SysMLSharedModule: Module<LangiumSharedServices, any> = {
    workspace: {
        WorkspaceManager: (services: LangiumSharedServices) => new SysMLWorkspaceManager(services),
        // Override LangiumDocuments to handle race conditions between didOpen and workspace initialization
        LangiumDocuments: (services: LangiumSharedServices) => createSysMLLangiumDocuments(services)
    }
};

/**
 * Custom module for SysML services
 */
export const SysMLModule: Module<SysMLServices, any> = {
    // Override LanguageMetaData with production mode to suppress Chevrotain warnings
    LanguageMetaData: () => SysMLProductionMetaData,
    ...(ENABLE_SIMPLIFIED_DIAGNOSTICS && {
        parser: {
            ParserErrorMessageProvider: () => new SysMLParserErrorMessageProvider()
        }
    }),
    // LSP-002: Scope provider and supporting services for cross-reference resolution
    references: {
        NameProvider: () => createSysMLNameProvider(),
        ScopeComputation: (services: SysMLServices) => createSysMLScopeComputation(services),
        ScopeProvider: (services: SysMLServices) => createSysMLScopeProvider(services)
    },
    // LSP-003: Custom validator that filters stdlib diagnostics and cascade errors
    validation: {
        DocumentValidator: (services: SysMLServices) => createFilteringDocumentValidator(services)
    },
    // LSP-004: Safe document symbol provider with error handling
    lsp: {
        DocumentSymbolProvider: (services: any) => createSysMLDocumentSymbolProvider(services)
    }
};

/**
 * Custom module for KerML-specific services
 * GRAM-008: KerML language for .kerml files
 */
export const KerMLModule: Module<KerMLServices, any> = {
    // Override LanguageMetaData with production mode to suppress Chevrotain warnings
    LanguageMetaData: () => KerMLProductionMetaData,
    ...(ENABLE_SIMPLIFIED_DIAGNOSTICS && {
        parser: {
            ParserErrorMessageProvider: () => new SysMLParserErrorMessageProvider()
        }
    }),
    // LSP-002: Scope provider and supporting services for cross-reference resolution
    references: {
        NameProvider: () => createSysMLNameProvider(),
        ScopeComputation: (services: KerMLServices) => createSysMLScopeComputation(services),
        ScopeProvider: (services: KerMLServices) => createSysMLScopeProvider(services)
    },
    // LSP-003: Custom validator that filters stdlib diagnostics and cascade errors
    validation: {
        DocumentValidator: (services: KerMLServices) => createFilteringDocumentValidator(services)
    },
    // LSP-004: Safe document symbol provider with error handling
    lsp: {
        DocumentSymbolProvider: (services: any) => createSysMLDocumentSymbolProvider(services)
    }
};
