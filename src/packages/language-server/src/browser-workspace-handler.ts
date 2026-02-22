/**
 * Browser Workspace Handler
 *
 * Handles workspace document management in browser mode where the client
 * pushes files to the server via custom LSP notifications.
 *
 * This module is extracted to be testable independently of the LSP connection.
 */

import { URI, LangiumDocument, LangiumSharedCoreServices } from 'langium';

export interface DocumentContent {
    uri: string;
    content: string;
    languageId: string;
}

export interface AddDocumentsResult {
    added: string[];
    updated: string[];
    errors: Array<{ uri: string; error: string }>;
    buildTimeMs: number;
}

export interface RemoveDocumentResult {
    removed: boolean;
    uri: string;
    error?: string;
}

export interface WorkspaceStats {
    documentCount: number;
    stdlibCount: number;
}

/**
 * Browser workspace document handler.
 * Manages documents pushed from the VS Code client in browser mode.
 */
export class BrowserWorkspaceHandler {
    private workspaceDocumentCount = 0;
    private readonly services: LangiumSharedCoreServices;
    private readonly logger: (message: string) => void;

    constructor(services: LangiumSharedCoreServices, logger?: (message: string) => void) {
        this.services = services;
        this.logger = logger ?? (() => {});
    }

    /**
     * Add or update documents received from the client.
     */
    async addDocuments(documents: DocumentContent[]): Promise<AddDocumentsResult> {
        const result: AddDocumentsResult = {
            added: [],
            updated: [],
            errors: [],
            buildTimeMs: 0
        };

        const langiumDocuments = this.services.workspace.LangiumDocuments;
        const documentFactory = this.services.workspace.LangiumDocumentFactory;
        const documentBuilder = this.services.workspace.DocumentBuilder;

        const addedDocs: LangiumDocument[] = [];

        for (const doc of documents) {
            try {
                const uri = URI.parse(doc.uri);

                // Check if document already exists
                if (langiumDocuments.hasDocument(uri)) {
                    this.logger(`  Document exists, updating: ${doc.uri}`);
                    try {
                        langiumDocuments.deleteDocument(uri);
                        result.updated.push(doc.uri);
                    } catch (e) {
                        this.logger(`  Warning: Could not delete existing document: ${e}`);
                    }
                } else {
                    this.workspaceDocumentCount++;
                    result.added.push(doc.uri);
                }

                // Create new document from content
                const langiumDoc = documentFactory.fromString(doc.content, uri);

                // Add to document registry
                langiumDocuments.addDocument(langiumDoc);
                addedDocs.push(langiumDoc);

                this.logger(`  Processed: ${doc.uri}`);
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                result.errors.push({ uri: doc.uri, error: errorMsg });
                this.logger(`  Failed to add document: ${doc.uri}: ${errorMsg}`);
            }
        }

        // Build the documents
        if (addedDocs.length > 0) {
            this.logger(`Building ${addedDocs.length} documents...`);
            const buildStart = Date.now();
            try {
                await documentBuilder.build(addedDocs, { validation: true });
                result.buildTimeMs = Date.now() - buildStart;
                this.logger(`Build complete: ${addedDocs.length} documents in ${result.buildTimeMs}ms`);
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                this.logger(`Document build failed: ${errorMsg}`);
                // Add build error to all documents
                for (const doc of addedDocs) {
                    result.errors.push({ uri: doc.uri.toString(), error: `Build failed: ${errorMsg}` });
                }
            }
        }

        return result;
    }

    /**
     * Remove a document from the workspace.
     */
    removeDocument(uri: string): RemoveDocumentResult {
        const result: RemoveDocumentResult = {
            removed: false,
            uri
        };

        try {
            const docUri = URI.parse(uri);
            const langiumDocuments = this.services.workspace.LangiumDocuments;

            if (langiumDocuments.hasDocument(docUri)) {
                langiumDocuments.deleteDocument(docUri);
                this.workspaceDocumentCount = Math.max(0, this.workspaceDocumentCount - 1);
                result.removed = true;
                this.logger(`  Document removed: ${uri}`);
            } else {
                this.logger(`  Document not found: ${uri}`);
            }
        } catch (error) {
            result.error = error instanceof Error ? error.message : String(error);
            this.logger(`Failed to remove document: ${uri}: ${result.error}`);
        }

        return result;
    }

    /**
     * Get current workspace statistics.
     */
    getStats(): WorkspaceStats {
        const langiumDocuments = this.services.workspace.LangiumDocuments;
        let totalCount = 0;

        // Count all documents
        for (const _ of langiumDocuments.all) {
            totalCount++;
        }

        return {
            documentCount: this.workspaceDocumentCount,
            stdlibCount: totalCount - this.workspaceDocumentCount
        };
    }

    /**
     * Check if a document exists in the workspace.
     */
    hasDocument(uri: string): boolean {
        try {
            const docUri = URI.parse(uri);
            return this.services.workspace.LangiumDocuments.hasDocument(docUri);
        } catch {
            return false;
        }
    }

    /**
     * Get a document by URI.
     */
    getDocument(uri: string): LangiumDocument | undefined {
        try {
            const docUri = URI.parse(uri);
            return this.services.workspace.LangiumDocuments.getDocument(docUri);
        } catch {
            return undefined;
        }
    }
}
