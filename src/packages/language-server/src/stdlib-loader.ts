/**
 * Standard Library Loader for Programmatic Use
 *
 * This module provides a function to load the SysML/KerML standard library
 * when using the language services programmatically (not via LSP).
 *
 * Problem: When using createSysMLServices() directly, the standard library
 * is NOT automatically loaded because stdlib loading happens during LSP
 * initialization (in SysMLWorkspaceManager.loadAdditionalDocuments).
 *
 * Solution: This module exports loadStandardLibrary() which can be called
 * after createSysMLServices() to load all stdlib files.
 *
 * Usage:
 *   import { createSysMLServices, loadStandardLibrary } from '@sysml/language-server';
 *   import { NodeFileSystem } from 'langium/node';
 *
 *   const services = createSysMLServices(NodeFileSystem);
 *   await loadStandardLibrary(services);
 *
 *   // Now stdlib types like ScalarValues::Boolean will resolve correctly
 */

import type { LangiumSharedServices } from 'langium/lsp';
import type { LangiumDocument } from 'langium';
import { URI } from 'langium';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { SysMLDocument } from './workspace-manager.js';
import { STDLIB_DEPENDENCY_LAYERS } from './stdlib-config.js';

/**
 * Result of loading the standard library
 */
export interface StdlibLoadResult {
    success: boolean;
    filesLoaded: number;
    filesExpected: number;
    errors: string[];
    warnings: string[];
    loadTimeMs: number;
}

/**
 * Options for loading the standard library
 */
export interface StdlibLoadOptions {
    /** Custom path to stdlib directory (auto-detected if not provided) */
    stdlibPath?: string;
    /** Whether to log progress (default: false) */
    verbose?: boolean;
    /** Whether to run validation on stdlib files (default: false) */
    validate?: boolean;
}

// STDLIB_DEPENDENCY_LAYERS is now imported from stdlib-config.ts
// This ensures a single source of truth for all 94 stdlib files

/**
 * Find the stdlib directory path
 */
function findStdlibPath(): string | null {
    // PRIORITY 1: Explicit override via environment variable
    // This allows development setups and custom deployments to specify stdlib location
    const envPath = process.env.SYSML_STDLIB_PATH;
    if (envPath) {
        const markerFile = path.join(envPath, 'Base.kerml');
        if (fs.existsSync(markerFile)) {
            return envPath;
        }
        // If env var is set but invalid, log warning and fall through to auto-detection
        console.warn(`[stdlib] SYSML_STDLIB_PATH set to '${envPath}' but Base.kerml not found there`);
    }

    // PRIORITY 2: Auto-detection from module location
    let dirPath: string;
    if (typeof __dirname !== 'undefined') {
        dirPath = __dirname;
    } else {
        const __filename = fileURLToPath(import.meta.url);
        dirPath = path.dirname(__filename);
    }

    const possiblePaths = [
        // From source: src/stdlib
        path.resolve(dirPath, 'stdlib'),
        // From dist: dist/src -> dist/stdlib
        path.resolve(dirPath, '..', 'stdlib'),
        // From bundled: dist/language-server/main-node.bundle.js -> dist/language-server/stdlib
        path.resolve(dirPath, 'stdlib'),
        // Alternative bundled location
        path.resolve(dirPath, '..', '..', 'stdlib'),
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            return p;
        }
    }

    return null;
}

/**
 * Load the SysML/KerML standard library for programmatic use.
 *
 * Call this function after createSysMLServices() to enable resolution of
 * stdlib types like ScalarValues::Boolean, Base::String, etc.
 *
 * @param services - The services object returned by createSysMLServices()
 * @param options - Optional configuration
 * @returns Promise<StdlibLoadResult> - Result of the loading operation
 *
 * @example
 * ```typescript
 * import { createSysMLServices, loadStandardLibrary } from '@sysml/language-server';
 * import { NodeFileSystem } from 'langium/node';
 *
 * const services = createSysMLServices(NodeFileSystem);
 * const result = await loadStandardLibrary(services);
 *
 * if (result.success) {
 *     console.log(`Loaded ${result.filesLoaded} stdlib files`);
 * }
 * ```
 */
export async function loadStandardLibrary(
    services: { shared: LangiumSharedServices },
    options: StdlibLoadOptions = {}
): Promise<StdlibLoadResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const verbose = options.verbose ?? false;
    const validate = options.validate ?? false;

    // Find stdlib path
    const stdlibPath = options.stdlibPath ?? findStdlibPath();

    if (!stdlibPath) {
        return {
            success: false,
            filesLoaded: 0,
            filesExpected: STDLIB_DEPENDENCY_LAYERS.flat().length,
            errors: ['Standard library directory not found'],
            warnings: [],
            loadTimeMs: Date.now() - startTime
        };
    }

    if (verbose) {
        console.log(`[stdlib] Loading from: ${stdlibPath}`);
    }

    // Get services
    const langiumDocuments = services.shared.workspace.LangiumDocuments;
    const documentBuilder = services.shared.workspace.DocumentBuilder;

    // Collect all documents
    const allDocuments: LangiumDocument[] = [];
    let loadedCount = 0;
    const totalExpected = STDLIB_DEPENDENCY_LAYERS.flat().length;

    // Load files layer by layer
    for (const layer of STDLIB_DEPENDENCY_LAYERS) {
        for (const filename of layer) {
            const filePath = path.join(stdlibPath, filename);

            if (!fs.existsSync(filePath)) {
                warnings.push(`${filename}: file not found`);
                continue;
            }

            try {
                const uri = URI.file(filePath);

                // Check if already loaded
                if (langiumDocuments.hasDocument(uri)) {
                    const doc = langiumDocuments.getDocument(uri) as SysMLDocument;
                    if (doc) {
                        doc.isStandard = true;
                        allDocuments.push(doc);
                        loadedCount++;
                        if (verbose) {
                            console.log(`[stdlib] ${filename}: already loaded`);
                        }
                    }
                    continue;
                }

                // Load the document
                const content = fs.readFileSync(filePath, 'utf-8');
                const documentFactory = services.shared.workspace.LangiumDocumentFactory;
                const document = documentFactory.fromString(content, uri) as SysMLDocument;

                // Mark as stdlib to suppress diagnostics
                document.isStandard = true;

                // Add to document registry
                langiumDocuments.addDocument(document);
                allDocuments.push(document);
                loadedCount++;

                if (verbose) {
                    console.log(`[stdlib] ${filename}: loaded`);
                }
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : String(err);
                errors.push(`${filename}: ${errMsg}`);
            }
        }
    }

    // Build all documents in batch (much faster than individual builds)
    if (allDocuments.length > 0) {
        try {
            if (verbose) {
                console.log(`[stdlib] Building ${allDocuments.length} documents...`);
            }

            await documentBuilder.build(allDocuments, {
                validation: validate
            });

            if (verbose) {
                console.log(`[stdlib] Build complete`);
            }
        } catch (buildError) {
            // Build errors are often non-fatal (incomplete dependencies)
            if (verbose) {
                console.warn(`[stdlib] Build warning:`, buildError);
            }
        }
    }

    // Clear diagnostics for stdlib (they can have linking warnings)
    for (const doc of allDocuments) {
        const sysmlDoc = doc as SysMLDocument;
        if (sysmlDoc.isStandard && doc.diagnostics && doc.diagnostics.length > 0) {
            doc.diagnostics = [];
        }
    }

    const loadTimeMs = Date.now() - startTime;

    if (verbose) {
        console.log(`[stdlib] Loaded ${loadedCount}/${totalExpected} files in ${loadTimeMs}ms`);
        if (errors.length > 0) {
            console.log(`[stdlib] Errors: ${errors.length}`);
        }
        if (warnings.length > 0) {
            console.log(`[stdlib] Warnings: ${warnings.length}`);
        }
    }

    return {
        success: errors.length === 0 && loadedCount > 0,
        filesLoaded: loadedCount,
        filesExpected: totalExpected,
        errors,
        warnings,
        loadTimeMs
    };
}
