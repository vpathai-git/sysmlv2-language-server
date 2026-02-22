/**
 * SysML Documents Service
 *
 * Extends Langium's DefaultLangiumDocuments to:
 * 1. Handle race conditions during workspace initialization
 * 2. Track workspace documents that should persist on close
 * 3. Normalize GitHub VFS URIs to prevent duplicates
 *
 * Document Types:
 * - Workspace documents: Discovered during proactive scan, persist on close
 * - Editor documents: Opened by user, deleted on close (default Langium behavior)
 * - Stdlib documents: Loaded at startup, never deleted
 */

import { DefaultLangiumDocuments, LangiumDocument, URI } from 'langium';
import type { LangiumSharedCoreServices } from 'langium';
import { getDocumentKey, normalizeGitHubUri, isGitHubVfsUri } from './uri-utils.js';

/**
 * Extended LangiumDocuments with workspace document tracking
 */
export class SysMLLangiumDocuments extends DefaultLangiumDocuments {
    /**
     * Set of normalized URIs for workspace documents (should persist on close)
     */
    private readonly workspaceUris = new Set<string>();

    /**
     * Map from normalized URI to all variant URIs we've seen
     * This helps with debugging and ensures we handle all variants
     */
    private readonly uriVariants = new Map<string, Set<string>>();

    /**
     * Logger function for debugging
     */
    private logger: (message: string) => void = () => {};

    constructor(services: LangiumSharedCoreServices) {
        super(services);
    }

    /**
     * Set the logger function
     */
    setLogger(logger: (message: string) => void): void {
        this.logger = logger;
    }

    /**
     * Register URIs as workspace documents that should persist on close.
     * Call this BEFORE opening the documents.
     */
    registerWorkspaceUris(uris: string[]): void {
        for (const uri of uris) {
            const normalizedUri = getDocumentKey(uri);
            this.workspaceUris.add(normalizedUri);
            this.trackUriVariant(normalizedUri, uri);
        }
        this.logger(`[SysML] Registered ${uris.length} workspace URIs (${this.workspaceUris.size} unique after normalization)`);
    }

    /**
     * Check if a URI is a registered workspace document
     */
    isWorkspaceDocument(uri: string | URI): boolean {
        const normalizedUri = getDocumentKey(typeof uri === 'string' ? uri : uri.toString());
        return this.workspaceUris.has(normalizedUri);
    }

    /**
     * Track URI variants for debugging
     */
    private trackUriVariant(normalizedUri: string, originalUri: string): void {
        if (!this.uriVariants.has(normalizedUri)) {
            this.uriVariants.set(normalizedUri, new Set());
        }
        this.uriVariants.get(normalizedUri)!.add(originalUri);
    }

    /**
     * Get document by URI, checking normalized variants for GitHub VFS URIs
     */
    override getDocument(uri: URI): LangiumDocument | undefined {
        // First try the exact URI
        let doc = super.getDocument(uri);
        if (doc) {
            return doc;
        }

        // For GitHub VFS URIs, try the normalized form
        if (isGitHubVfsUri(uri.toString())) {
            const normalizedUri = normalizeGitHubUri(uri.toString());

            // Try to find by checking all documents
            for (const existingDoc of this.all) {
                const existingNormalized = getDocumentKey(existingDoc.uri.toString());
                if (existingNormalized === normalizedUri) {
                    return existingDoc;
                }
            }
        }

        return undefined;
    }

    /**
     * Check if document exists, including normalized variants
     */
    override hasDocument(uri: URI): boolean {
        // First try the exact URI
        if (super.hasDocument(uri)) {
            return true;
        }

        // For GitHub VFS URIs, check normalized form
        if (isGitHubVfsUri(uri.toString())) {
            const normalizedUri = normalizeGitHubUri(uri.toString());

            for (const existingDoc of this.all) {
                const existingNormalized = getDocumentKey(existingDoc.uri.toString());
                if (existingNormalized === normalizedUri) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Override addDocument to be idempotent and handle URI normalization.
     * If document already exists (including normalized variants), just return.
     */
    override addDocument(document: LangiumDocument): void {
        const uriString = document.uri.toString();
        const normalizedUri = getDocumentKey(uriString);

        // Track this URI variant
        this.trackUriVariant(normalizedUri, uriString);

        // Check if already present (by exact or normalized URI)
        if (this.hasDocument(document.uri)) {
            this.logger(`[SysML] Document already present (normalized), skipping: ${uriString}`);
            return;
        }

        try {
            super.addDocument(document);
        } catch (err) {
            // Handle race condition
            if (err instanceof Error && err.message.includes('already present')) {
                this.logger(`[SysML] Document race condition handled: ${uriString}`);
                return;
            }
            throw err;
        }
    }

    /**
     * Override deleteDocument to prevent deletion of workspace documents.
     * Workspace documents are only invalidated (cleared), not removed.
     */
    override deleteDocument(uri: URI): LangiumDocument | undefined {
        const uriString = uri.toString();
        const normalizedUri = getDocumentKey(uriString);

        // Check if this is a workspace document
        if (this.workspaceUris.has(normalizedUri)) {
            this.logger(`[SysML] Workspace document closed (preserving): ${uriString}`);

            // Instead of deleting, just invalidate the document
            // This clears computed state but keeps it in the registry
            return this.invalidateDocument(uri);
        }

        // For non-workspace documents, use default behavior
        return super.deleteDocument(uri);
    }

    /**
     * Get the number of registered workspace URIs
     */
    getWorkspaceUriCount(): number {
        return this.workspaceUris.size;
    }

    /**
     * Clear all workspace URI registrations (useful for restart)
     */
    clearWorkspaceUris(): void {
        this.workspaceUris.clear();
        this.uriVariants.clear();
        this.logger('[SysML] Cleared all workspace URI registrations');
    }

    /**
     * Get debug info about URI variants
     */
    getUriVariantsDebug(): Map<string, string[]> {
        const result = new Map<string, string[]>();
        for (const [normalized, variants] of this.uriVariants) {
            result.set(normalized, Array.from(variants));
        }
        return result;
    }
}

/**
 * Factory function for creating SysML documents service
 */
export function createSysMLLangiumDocuments(services: LangiumSharedCoreServices): SysMLLangiumDocuments {
    return new SysMLLangiumDocuments(services);
}
