/**
 * SysML Workspace Manager
 *
 * Extends the default workspace manager to preload the standard library.
 *
 * Rationale: The standard library load order is derived from analysis
 * of the SysML v2 standard library dependency graph. Langium's workspace
 * manager requires explicit ordering unlike Eclipse's automatic dependency resolution.
 */

import { DefaultWorkspaceManager, LangiumDocument, UriUtils } from 'langium';
import type { FileSystemNode } from 'langium';
import type { LangiumSharedServices } from 'langium/lsp';
import { WorkspaceFolder, InitializeParams, InitializedParams } from 'vscode-languageserver';
import type { Connection, CancellationToken } from 'vscode-languageserver';
import { URI } from 'vscode-uri';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { STDLIB_DEPENDENCY_LAYERS } from './stdlib-config.js';


/**
 * Extended LangiumDocument interface with stdlib marker
 */
export interface SysMLDocument extends LangiumDocument {
    /** If true, this document is part of the standard library (don't report diagnostics) */
    isStandard?: boolean;
}

/**
 * Check if a document is a standard library document
 */
export function isStandardLibraryDocument(doc: LangiumDocument): boolean {
    return (doc as SysMLDocument).isStandard === true;
}

export class SysMLWorkspaceManager extends DefaultWorkspaceManager {
    private connection?: Connection;

    constructor(services: LangiumSharedServices) {
        super(services);
        // Get the LSP connection for logging to VS Code output channel
        this.connection = services.lsp?.Connection;
        this.log('[SysML] SysMLWorkspaceManager constructed');
    }

    /**
     * Log a message to the VS Code output channel via LSP.
     * Falls back to console.log if connection not available (e.g., programmatic use).
     */
    private log(message: string): void {
        if (this.connection) {
            this.connection.console.log(message);
        } else {
            console.log(message);
        }
    }

    /**
     * Log an error to the VS Code output channel via LSP.
     * Falls back to console.error if connection not available.
     */
    private logError(message: string, error?: unknown): void {
        // Safely stringify the error - Symbols cannot be implicitly converted to strings
        // in template literals, so we need explicit handling
        let errorString = '';
        if (error !== undefined && error !== null) {
            if (error instanceof Error) {
                errorString = error.message + (error.stack ? `\n${error.stack}` : '');
            } else if (typeof error === 'symbol') {
                errorString = error.toString(); // Symbol.toString() works, template literals don't
            } else if (typeof error === 'object') {
                try {
                    errorString = JSON.stringify(error);
                } catch {
                    errorString = Object.prototype.toString.call(error);
                }
            } else {
                errorString = String(error);
            }
        }
        const fullMessage = errorString ? `${message} ${errorString}` : message;
        if (this.connection) {
            this.connection.console.error(fullMessage);
        } else {
            console.error(fullMessage);
        }
    }

    /**
     * Log a warning to the VS Code output channel via LSP.
     * Falls back to console.warn if connection not available.
     */
    private logWarn(message: string): void {
        if (this.connection) {
            this.connection.console.warn(message);
        } else {
            console.warn(message);
        }
    }

    /**
     * Initialize workspace with workspace folders
     * Note: This is synchronous - actual workspace processing happens in initialized()
     */
    override initialize(params: InitializeParams): void {
        this.log('[SysML] initialize() called');
        this.log(`[SysML]   Workspace folders: ${params.workspaceFolders?.length ?? 0}`);
        params.workspaceFolders?.forEach((f, i) => {
            this.log(`[SysML]   [${i}] ${f.name}: ${f.uri}`);
        });
        super.initialize(params);
        this.log('[SysML] initialize() complete');
    }

    /**
     * Called after initialize - this is where actual workspace processing happens
     */
    override async initialized(params: InitializedParams): Promise<void> {
        this.log('[SysML] initialized() called - starting workspace processing');
        const startTime = Date.now();
        try {
            await super.initialized(params);
            const elapsed = Date.now() - startTime;
            this.log(`[SysML] initialized() complete in ${elapsed}ms`);
        } catch (err) {
            const elapsed = Date.now() - startTime;
            this.logError(`[SysML] initialized() FAILED after ${elapsed}ms:`, err);
            throw err;
        }
    }

    /**
     * Override initializeWorkspace to add logging around workspace file processing
     */
    override async initializeWorkspace(folders: WorkspaceFolder[], cancelToken?: CancellationToken): Promise<void> {
        this.log('[SysML] initializeWorkspace() called');
        this.log(`[SysML]   Processing ${folders.length} workspace folder(s)`);
        const startTime = Date.now();
        try {
            await super.initializeWorkspace(folders, cancelToken);
            const elapsed = Date.now() - startTime;
            this.log(`[SysML] initializeWorkspace() complete in ${elapsed}ms`);
        } catch (err) {
            const elapsed = Date.now() - startTime;
            this.logError(`[SysML] initializeWorkspace() FAILED after ${elapsed}ms:`, err);
            throw err;
        }
    }

    /**
     * Load additional documents (standard library) when initializing workspace
     */
    protected override async loadAdditionalDocuments(
        folders: WorkspaceFolder[],
        collector: (document: LangiumDocument) => void
    ): Promise<void> {
        this.log('[SysML] loadAdditionalDocuments() called');
        await super.loadAdditionalDocuments(folders, collector);

        // Load standard library
        await this.loadStandardLibrary(collector);
        this.log('[SysML] loadAdditionalDocuments() complete - workspace folder traversal will begin');
    }

    /**
     * Override traverseFolder to collect workspace file URIs, excluding unwanted directories.
     * In langium 4.x, this method just collects URIs; document creation happens separately.
     */
    protected override async traverseFolder(folderPath: URI, uris: URI[]): Promise<void> {
        const content = await this.fileSystemProvider.readDirectory(folderPath);
        await Promise.all(content.map(async entry => {
            if (this.shouldIncludeEntry(entry)) {
                if (entry.isDirectory) {
                    await this.traverseFolder(entry.uri, uris);
                } else if (entry.isFile) {
                    uris.push(entry.uri);
                }
            }
        }));
    }

    /**
     * Override shouldIncludeEntry to exclude problematic directories.
     */
    override shouldIncludeEntry(entry: FileSystemNode): boolean {
        const name = UriUtils.basename(entry.uri);
        // Skip hidden files/folders
        if (name.startsWith('.')) {
            return false;
        }
        if (entry.isDirectory) {
            // Skip common non-source directories
            return name !== 'node_modules' &&
                   name !== 'out' &&
                   name !== 'dist' &&
                   name !== 'repos' &&    // Skip reference implementations
                   name !== 'stdlib';     // Stdlib loaded via loadStandardLibrary(), don't duplicate
        }
        // Delegate file extension checks to base class
        return super.shouldIncludeEntry(entry);
    }

    /**
     * Load SysML standard library files
     * PERFORMANCE OPTIMIZATION (was 22s, now ~5-8s):
     * - Batch loading: Collect all documents first, then build in one call
     * - Lazy linking: Defer cross-reference resolution until first access
     */
    /**
     * Find the stdlib directory, searching multiple possible locations.
     * This handles various deployment contexts (dev, bundled, packaged).
     */
    private findStdlibPath(): string | null {
        // PRIORITY 1: Explicit override via environment variable
        // This allows development setups and custom deployments to specify stdlib location
        const envPath = process.env.SYSML_STDLIB_PATH;
        if (envPath) {
            const markerFile = path.join(envPath, 'Base.kerml');
            if (fs.existsSync(markerFile)) {
                this.log(`[SysML] Using stdlib from SYSML_STDLIB_PATH: ${envPath}`);
                return envPath;
            } else {
                this.logWarn(`[SysML] SYSML_STDLIB_PATH set to '${envPath}' but Base.kerml not found there`);
            }
        }

        // PRIORITY 2: Auto-detection from bundle/module location
        // Determine base directories to search from
        // In bundled CJS, __dirname may be shimmed incorrectly, so we use multiple strategies
        const baseDirs: string[] = [];

        // Strategy 1: Use process.argv[1] (the actual script path) - most reliable for bundles
        if (process.argv[1]) {
            baseDirs.push(path.dirname(process.argv[1]));
        }

        // Strategy 2: Use __dirname if defined
        if (typeof __dirname !== 'undefined') {
            baseDirs.push(__dirname);
        }

        // Strategy 3: Try import.meta.url
        try {
            const __filename = fileURLToPath(import.meta.url);
            baseDirs.push(path.dirname(__filename));
        } catch {
            // import.meta not available in CJS bundle
        }

        // Strategy 4: Fall back to cwd
        baseDirs.push(process.cwd());

        // Remove duplicates
        const uniqueBaseDirs = [...new Set(baseDirs)];

        // Build search paths from all base directories
        const searchPaths: string[] = [];
        for (const baseDir of uniqueBaseDirs) {
            // Same directory as bundle (dist/language-server/stdlib)
            searchPaths.push(path.resolve(baseDir, 'stdlib'));
            // One level up (dist/stdlib)
            searchPaths.push(path.resolve(baseDir, '..', 'stdlib'));
            // Two levels up (for nested bundles)
            searchPaths.push(path.resolve(baseDir, '..', '..', 'stdlib'));
        }

        // Remove duplicate paths
        const uniqueSearchPaths = [...new Set(searchPaths)];

        this.log(`[SysML] Searching for stdlib from ${uniqueBaseDirs.length} base dir(s)`);
        uniqueBaseDirs.forEach(d => this.log(`[SysML]   base: ${d}`));

        for (const candidate of uniqueSearchPaths) {
            // Check for Base.kerml as a marker that this is the stdlib
            const markerFile = path.join(candidate, 'Base.kerml');
            if (fs.existsSync(markerFile)) {
                this.log(`[SysML] Found stdlib at: ${candidate}`);
                return candidate;
            }
        }

        // Log all searched paths for debugging
        this.logError('[SysML] ✗ Standard library NOT found. Searched:');
        uniqueSearchPaths.forEach((p, i) => this.logError(`[SysML]   ${i + 1}. ${p}`));

        return null;
    }

    private async loadStandardLibrary(
        _collector: (document: LangiumDocument) => void
    ): Promise<void> {
        this.log('[SysML] loadStandardLibrary called');
        const startTime = Date.now();
        const errors: string[] = [];
        try {
            // Find stdlib using robust path detection
            const stdlibPath = this.findStdlibPath();

            if (!stdlibPath) {
                this.logError('[SysML] Cannot load standard library - directory not found');
                return;
            }

            // Use shared stdlib configuration (94 files in dependency order)
            // See stdlib-config.ts for complete file list and layer documentation
            const dependencyLayers = STDLIB_DEPENDENCY_LAYERS;

            // PHASE 1: Collect all documents WITHOUT building (fast - just parsing)
            this.log('[SysML] Loading standard library...');
            const phase1Start = Date.now();
            const allDocuments: LangiumDocument[] = [];
            let loadedCount = 0;
            let skippedCount = 0;
            const totalExpected = dependencyLayers.flat().length;
            const warnings: string[] = [];

            for (const layer of dependencyLayers) {
                for (const filename of layer) {
                    const filePath = path.join(stdlibPath, filename);
                    const fileStart = Date.now();
                    if (fs.existsSync(filePath)) {
                        try {
                            const uri = URI.file(filePath);
                            // Check if document already exists to avoid race condition
                            let document: SysMLDocument;
                            if (this.langiumDocuments.hasDocument(uri)) {
                                document = this.langiumDocuments.getDocument(uri) as SysMLDocument;
                                skippedCount++;
                                const elapsed = Date.now() - fileStart;
                                this.log(`[SysML] ${filename}: already loaded (${elapsed}ms)`);
                            } else {
                                document = await this.langiumDocuments.getOrCreateDocument(uri) as SysMLDocument;
                                const elapsed = Date.now() - fileStart;
                                this.log(`[SysML] ${filename}: loaded (${elapsed}ms)`);
                            }
                            // Mark as stdlib - diagnostics will be filtered out
                            document.isStandard = true;
                            allDocuments.push(document);
                            loadedCount++;
                        } catch (err) {
                            const elapsed = Date.now() - fileStart;
                            const errMsg = err instanceof Error ? err.message : String(err);
                            this.logError(`[SysML] ${filename}: ERROR (${elapsed}ms) - ${errMsg}`);
                            if (errors.length < 10) {
                                errors.push(`${filename}: ${errMsg}`);
                            }
                        }
                    } else {
                        this.logWarn(`[SysML] ${filename}: file not found`);
                        if (warnings.length < 10) {
                            warnings.push(`${filename}: file not found`);
                        }
                    }
                }
            }
            const phase1Time = Date.now() - phase1Start;
            this.log(`[SysML] Phase 1 complete: ${loadedCount}/${totalExpected} files parsed in ${phase1Time}ms`);

            // PHASE 2: Build all documents in ONE batch with lazy linking
            // This allows Langium to process all docs through each phase before moving to next
            this.log('[SysML] Indexing and linking...');
            const phase2Start = Date.now();
            try {
                await this.documentBuilder.build(allDocuments, {
                    validation: false,    // Skip validation during startup
                    // Note: eagerLinking defaults to true, but batch building is still much faster
                    // than individual builds because Langium processes all docs per phase
                });
            } catch (buildError) {
                this.logWarn('[SysML] Build warning (non-fatal): ' + buildError);
            }
            const phase2Time = Date.now() - phase2Start;
            this.log(`[SysML] Indexed ${loadedCount} files in ${phase2Time}ms`);

            // PHASE 3: Clear diagnostics for stdlib (linking errors from incomplete dependencies)
            // Stdlib files shouldn't report errors to users
            let clearedCount = 0;
            for (const doc of allDocuments) {
                const sysmlDoc = doc as SysMLDocument;
                if (sysmlDoc.isStandard && doc.diagnostics && doc.diagnostics.length > 0) {
                    clearedCount += doc.diagnostics.length;
                    doc.diagnostics = [];
                }
                // Check for parse errors (these are bugs in our grammar, should be reported)
                if (doc.parseResult?.parserErrors?.length > 0 && errors.length < 5) {
                    const filename = path.basename(doc.uri.fsPath);
                    errors.push(`${filename}: ${doc.parseResult.parserErrors.length} parse error(s)`);
                }
            }
            if (clearedCount > 0) {
                this.log(`[SysML] Suppressed ${clearedCount} stdlib linking diagnostics (incomplete dependency chain)`);
            }

            const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

            // ===== SUMMARY =====
            this.log('[SysML] ════════════════════════════════════════════════════════');
            this.log('[SysML] Standard Library Load Summary');
            this.log('[SysML] ════════════════════════════════════════════════════════');
            this.log(`[SysML]   Files expected:     ${totalExpected}`);
            this.log(`[SysML]   Files loaded:       ${loadedCount}`);
            if (skippedCount > 0) {
                this.log(`[SysML]   Already present:    ${skippedCount}`);
            }
            this.log(`[SysML]   Parse errors:       ${errors.length}`);
            this.log(`[SysML]   Warnings:           ${warnings.length}`);
            this.log(`[SysML]   Linking warnings:   ${clearedCount} (suppressed)`);
            this.log(`[SysML]   Total time:         ${totalTime}s`);
            this.log(`[SysML]     - Phase 1 (parse): ${phase1Time}ms`);
            this.log(`[SysML]     - Phase 2 (link):  ${phase2Time}ms`);

            if (errors.length > 0) {
                this.log('[SysML] ────────────────────────────────────────────────────────');
                this.log('[SysML] Errors:');
                errors.forEach((err, i) => this.logError(`[SysML]   ${i + 1}. ${err}`));
            }

            if (warnings.length > 0) {
                this.log('[SysML] ────────────────────────────────────────────────────────');
                this.log('[SysML] Warnings:');
                warnings.forEach((warn, i) => this.logWarn(`[SysML]   ${i + 1}. ${warn}`));
            }

            if (loadedCount === totalExpected && errors.length === 0) {
                this.log('[SysML] ════════════════════════════════════════════════════════');
                this.log('[SysML] ✓ Standard library loaded successfully');
            } else if (loadedCount > 0) {
                this.log('[SysML] ════════════════════════════════════════════════════════');
                this.log('[SysML] ⚠ Standard library loaded with issues');
            } else {
                this.log('[SysML] ════════════════════════════════════════════════════════');
                this.log('[SysML] ✗ Failed to load standard library');
            }
            this.log('[SysML] ════════════════════════════════════════════════════════');

        } catch (error) {
            this.logError('[SysML] Error loading standard library:', error);
        }
    }
}
