/**
 * Browser SysML Module
 *
 * Creates SysML language services for browser context (vscode.dev, Codespaces).
 * Uses DefaultWorkspaceManager since we can't access the filesystem.
 * Stdlib is loaded separately via browser-stdlib-loader.ts.
 */
import type { LangiumSharedServices } from 'langium/lsp';
import type { LangiumCoreServices } from 'langium';
import { createDefaultSharedModule, createDefaultModule } from 'langium/lsp';
import { inject, DocumentState, DefaultWorkspaceManager, type Module } from 'langium';
import {
    SysMLGeneratedSharedModule,
    SysMLGeneratedModule,
    KerMLGeneratedModule
} from '@sysml/grammar';
import { SysMLModule, KerMLModule } from './sysml-module.js';
import { augmentAst } from '@sysml/core';
import { registerSysMLValidationChecks } from './validation/sysml-langium-validator.js';
import { createSysMLLangiumDocuments } from './sysml-documents.js';

export type SysMLServices = LangiumCoreServices;
export type KerMLServices = LangiumCoreServices;

export function createBrowserSysMLServices(context: any): {
    shared: LangiumSharedServices;
    SysML: SysMLServices;
    KerML: KerMLServices;
} {
    const shared = inject(
        createDefaultSharedModule(context),
        SysMLGeneratedSharedModule,
        BrowserSysMLSharedModule
    );

    // Create SysML services for .sysml files
    const SysML = inject(
        createDefaultModule({ shared }),
        SysMLGeneratedModule,
        SysMLModule
    );

    // Create KerML services for .kerml files
    const KerML = inject(
        createDefaultModule({ shared }),
        KerMLGeneratedModule,
        KerMLModule
    );

    // Register both languages
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

export const BrowserSysMLSharedModule: Module<LangiumSharedServices, any> = {
    workspace: {
        // Use DefaultWorkspaceManager for browser - no fs access
        // Stdlib is loaded via browser-stdlib-loader.ts
        WorkspaceManager: (services: any) => new DefaultWorkspaceManager(services),
        // Override LangiumDocuments to handle race conditions
        LangiumDocuments: (services: LangiumSharedServices) => createSysMLLangiumDocuments(services)
    }
};
