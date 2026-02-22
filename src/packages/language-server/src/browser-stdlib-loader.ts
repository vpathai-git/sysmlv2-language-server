/**
 * Browser Standard Library Loader
 *
 * In the browser context, the stdlib files are embedded in the bundle at build time
 * via esbuild's define feature. This module loads those embedded files into the
 * Langium document registry.
 *
 * Usage:
 *   import { loadEmbeddedStdlib } from './browser-stdlib-loader.js';
 *   await loadEmbeddedStdlib(services);
 */

import type { LangiumSharedServices } from 'langium/lsp';
import type { LangiumDocument } from 'langium';
import { URI } from 'langium';
import { STDLIB_DEPENDENCY_LAYERS } from './stdlib-config.js';

/**
 * Stdlib files embedded at build time by esbuild-browser.mjs
 * This is defined via esbuild's `define` option as globalThis.EMBEDDED_STDLIB
 */
declare const EMBEDDED_STDLIB: Record<string, string> | undefined;

/**
 * Extended LangiumDocument interface with stdlib marker
 */
interface SysMLDocument extends LangiumDocument {
    isStandard?: boolean;
}

/**
 * Result of loading the embedded stdlib
 */
export interface EmbeddedStdlibLoadResult {
    success: boolean;
    filesLoaded: number;
    errors: string[];
    loadTimeMs: number;
}

// STDLIB_DEPENDENCY_LAYERS imported from stdlib-config.ts (single source of truth)

/**
 * Load the embedded standard library in browser context.
 *
 * @param services - The shared Langium services
 * @returns Promise<EmbeddedStdlibLoadResult>
 */
export async function loadEmbeddedStdlib(
    services: { shared: LangiumSharedServices }
): Promise<EmbeddedStdlibLoadResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let loadedCount = 0;

    // Check if embedded stdlib is available
    const embeddedStdlib = typeof EMBEDDED_STDLIB !== 'undefined' ? EMBEDDED_STDLIB : undefined;

    if (!embeddedStdlib || Object.keys(embeddedStdlib).length === 0) {
        console.error('[SysML Browser] No embedded stdlib found');
        return {
            success: false,
            filesLoaded: 0,
            errors: ['No embedded stdlib found in bundle'],
            loadTimeMs: Date.now() - startTime
        };
    }

    const langiumDocuments = services.shared.workspace.LangiumDocuments;
    const documentBuilder = services.shared.workspace.DocumentBuilder;
    const documentFactory = services.shared.workspace.LangiumDocumentFactory;

    const allDocuments: LangiumDocument[] = [];

    // Load files in dependency order
    for (const layer of STDLIB_DEPENDENCY_LAYERS) {
        for (const filename of layer) {
            const content = embeddedStdlib[filename];
            if (!content) {
                errors.push(`${filename}: not found in embedded stdlib`);
                continue;
            }

            try {
                // Use stdlib:// URI scheme for embedded files
                const uri = URI.parse(`stdlib:///${filename}`);

                // Check if already loaded
                if (langiumDocuments.hasDocument(uri)) {
                    loadedCount++;
                    continue;
                }

                // Create document from embedded content
                const document = documentFactory.fromString(content, uri) as SysMLDocument;
                document.isStandard = true;

                langiumDocuments.addDocument(document);
                allDocuments.push(document);
                loadedCount++;

            } catch (err) {
                const errMsg = err instanceof Error ? err.message : String(err);
                errors.push(`${filename}: ${errMsg}`);
            }
        }
    }

    // Build all documents
    if (allDocuments.length > 0) {
        try {
            await documentBuilder.build(allDocuments, { validation: false });
        } catch (buildError) {
            console.warn('[SysML Browser] Build warning:', buildError);
        }
    }

    // Clear diagnostics for stdlib (they may have linking warnings)
    for (const doc of allDocuments) {
        const sysmlDoc = doc as SysMLDocument;
        if (sysmlDoc.isStandard && doc.diagnostics && doc.diagnostics.length > 0) {
            doc.diagnostics = [];
        }
    }

    const loadTimeMs = Date.now() - startTime;

    return {
        success: errors.length === 0 && loadedCount > 0,
        filesLoaded: loadedCount,
        errors,
        loadTimeMs
    };
}

/**
 * Check if embedded stdlib is available
 */
export function hasEmbeddedStdlib(): boolean {
    return typeof EMBEDDED_STDLIB !== 'undefined' &&
           EMBEDDED_STDLIB !== null &&
           Object.keys(EMBEDDED_STDLIB).length > 0;
}
