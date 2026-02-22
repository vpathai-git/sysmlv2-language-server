/**
 * SysML v2 Language Server - Browser Entry Point
 *
 * This runs in a Web Worker context (vscode.dev, Codespaces, etc.)
 * The stdlib is embedded in the bundle at build time.
 *
 * Architecture:
 * - Uses EmptyFileSystem - server cannot access filesystem
 * - Documents come via standard LSP textDocument/didOpen notifications
 * - Client opens files, Language Client syncs them automatically
 * - Workspace documents are registered via sysml/registerWorkspaceFiles
 *   to prevent deletion on close
 */

import { EmptyFileSystem } from 'langium';
import { startLanguageServer } from 'langium/lsp';
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser.js';
import { createBrowserSysMLServices } from './browser-sysml-module.js';
import { loadEmbeddedStdlib, hasEmbeddedStdlib } from './browser-stdlib-loader.js';
import type { SysMLLangiumDocuments } from './sysml-documents.js';
import { getDocumentKey } from './uri-utils.js';

// Build info - injected at build time
declare const BUILD_VERSION: string | undefined;
declare const BUILD_TIMESTAMP: string | undefined;

/* Browser-specific setup */
const messageReader = new BrowserMessageReader(self as DedicatedWorkerGlobalScope);
const messageWriter = new BrowserMessageWriter(self as DedicatedWorkerGlobalScope);

const connection = createConnection(messageReader, messageWriter);

// Build info
const version = typeof BUILD_VERSION !== 'undefined' ? BUILD_VERSION : 'dev';
const timestamp = typeof BUILD_TIMESTAMP !== 'undefined' ? BUILD_TIMESTAMP : 'unknown';
const stdlibStatus = hasEmbeddedStdlib() ? 'available' : 'NOT FOUND';

// Helper for structured logging
function log(message: string): void {
    const ts = new Date().toISOString().substring(11, 23);
    const formatted = `[${ts}] [Server] ${message}`;
    try {
        connection.console.log(formatted);
    } catch {
        // Connection may not be ready yet
    }
}

function logError(message: string, error?: unknown): void {
    const ts = new Date().toISOString().substring(11, 23);
    const errorStr = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
    const formatted = `[${ts}] [Server] ERROR: ${message}${error ? ': ' + errorStr : ''}`;
    console.error(formatted);
    try {
        connection.console.error(formatted);
    } catch {
        // Connection may not be ready yet
    }
}

// Startup logging
log(`Language Server starting (v${version}, built ${timestamp})`);
log(`Embedded stdlib: ${stdlibStatus}`);

// Create services with EmptyFileSystem - no filesystem access needed
// Documents come via standard LSP textDocument/didOpen notifications
const { shared } = createBrowserSysMLServices({ connection, ...EmptyFileSystem });

// Get the SysMLLangiumDocuments instance and wire up the logger
const langiumDocuments = shared.workspace.LangiumDocuments as SysMLLangiumDocuments;
if (langiumDocuments.setLogger) {
    langiumDocuments.setLogger(log);
}

// ============================================================================
// Custom LSP Notification: sysml/registerWorkspaceFiles
// ============================================================================
// This notification is sent by the client before opening workspace files.
// It registers URIs as "workspace documents" that should persist on close.

interface RegisterWorkspaceFilesParams {
    files: string[];
}

connection.onNotification('sysml/registerWorkspaceFiles', (params: RegisterWorkspaceFilesParams) => {
    log(`Received workspace files registration: ${params.files.length} files`);

    if (langiumDocuments.registerWorkspaceUris) {
        langiumDocuments.registerWorkspaceUris(params.files);
        log(`Registered ${langiumDocuments.getWorkspaceUriCount()} unique workspace URIs`);
    } else {
        log('WARNING: LangiumDocuments does not support workspace URI registration');
    }
});

// ============================================================================
// Custom LSP Request: sysml/getWorkspaceStats
// ============================================================================
// Returns statistics about the current workspace state

interface WorkspaceStatsResult {
    totalDocuments: number;
    workspaceDocuments: number;
    stdlibDocuments: number;
    registeredWorkspaceUris: number;
}

connection.onRequest('sysml/getWorkspaceStats', (): WorkspaceStatsResult => {
    let totalDocs = 0;
    let stdlibDocs = 0;

    for (const doc of langiumDocuments.all) {
        totalDocs++;
        const uriStr = doc.uri.toString();
        if (uriStr.includes('stdlib') || uriStr.includes('sysml.library')) {
            stdlibDocs++;
        }
    }

    const workspaceUriCount = langiumDocuments.getWorkspaceUriCount?.() ?? 0;

    return {
        totalDocuments: totalDocs,
        workspaceDocuments: totalDocs - stdlibDocs,
        stdlibDocuments: stdlibDocs,
        registeredWorkspaceUris: workspaceUriCount
    };
});

// Hook into Langium's initialized handler to load stdlib
const originalInitialized = shared.lsp.LanguageServer.initialized.bind(shared.lsp.LanguageServer);
shared.lsp.LanguageServer.initialized = async (params) => {
    // Call original Langium initialization first
    await originalInitialized(params);

    log('Language Server initialized');
    log(`Version: ${version}, Built: ${timestamp}`);

    // Load embedded stdlib
    if (hasEmbeddedStdlib()) {
        try {
            log('Loading embedded stdlib...');
            const result = await loadEmbeddedStdlib({ shared });
            if (result.success) {
                log(`Stdlib loaded: ${result.filesLoaded} files in ${result.loadTimeMs}ms`);
            } else {
                logError(`Stdlib load failed: ${result.errors.join(', ')}`);
            }
        } catch (err) {
            logError('Stdlib load error', err);
        }
    } else {
        log('WARNING: No embedded stdlib available');
    }

    log('Server ready - waiting for documents via LSP');
};

// Track document events for debugging
const documents = shared.workspace.TextDocuments;
let documentCount = 0;

// Map to track normalized URIs we've seen (for deduplication logging)
const seenNormalizedUris = new Set<string>();

documents.onDidOpen(event => {
    const uri = event.document.uri;
    const normalizedUri = getDocumentKey(uri);

    // Check if we've already seen this document (via a different URI variant)
    if (seenNormalizedUris.has(normalizedUri)) {
        log(`Document opened (duplicate URI variant): ${uri}`);
    } else {
        documentCount++;
        seenNormalizedUris.add(normalizedUri);
        log(`Document opened [${documentCount}]: ${uri}`);
    }
});

documents.onDidChangeContent(event => {
    log(`Document changed: ${event.document.uri}`);
});

documents.onDidClose(event => {
    const uri = event.document.uri;
    const normalizedUri = getDocumentKey(uri);

    // Check if this is a workspace document (will be preserved)
    const isWorkspaceDoc = langiumDocuments.isWorkspaceDocument?.(uri) ?? false;

    if (isWorkspaceDoc) {
        log(`Document closed (workspace, preserved): ${uri}`);
        // Don't decrement count - document is still in registry
    } else {
        documentCount = Math.max(0, documentCount - 1);
        seenNormalizedUris.delete(normalizedUri);
        log(`Document closed [${documentCount} remaining]: ${uri}`);
    }
});

// Track build phases to verify indexing
const documentBuilder = shared.workspace.DocumentBuilder;
documentBuilder.onBuildPhase(2 /* DocumentState.IndexedContent */, (docs) => {
    log(`Indexed ${docs.length} documents (content phase)`);
});

documentBuilder.onBuildPhase(4 /* DocumentState.Linked */, (docs) => {
    log(`Linked ${docs.length} documents - cross-file references resolved`);
});

documentBuilder.onBuildPhase(6 /* DocumentState.Validated */, (docs) => {
    let totalDocs = 0;
    for (const _ of langiumDocuments.all) totalDocs++;
    const workspaceCount = langiumDocuments.getWorkspaceUriCount?.() ?? 0;
    log(`Validated ${docs.length} documents. Total in registry: ${totalDocs}, Workspace URIs: ${workspaceCount}`);
});

// Start the language server - this registers all standard LSP handlers
// including textDocument/didOpen, didChange, didClose via documents.listen(connection)
startLanguageServer(shared);

log('Language server started, waiting for initialization...');
