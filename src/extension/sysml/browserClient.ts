/**
 * SysML v2 Language Client - Browser Mode
 *
 * Architecture:
 * - Proactive workspace discovery: Finds all SysML/KerML files upfront
 * - Registers workspace files with server BEFORE opening them
 * - Workspace files persist on close (only deleted on file deletion)
 * - URI normalization: Handles vscode-vfs://github/ and github:// variants
 * - Event-driven workspace initialization (no polling!)
 */

import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions
} from 'vscode-languageclient/browser';

let client: LanguageClient | undefined;
let outputChannel: vscode.OutputChannel | undefined;
let fileWatcher: vscode.FileSystemWatcher | undefined;

function log(message: string): void {
    const timestamp = new Date().toISOString().substring(11, 23);
    const formatted = `[${timestamp}] ${message}`;
    outputChannel?.appendLine(formatted);
    console.log(`[SysML Client] ${message}`);
}

function logError(message: string, error?: unknown): void {
    const timestamp = new Date().toISOString().substring(11, 23);
    const errorStr = error instanceof Error ? error.message : String(error);
    const formatted = `[${timestamp}] ERROR: ${message}${error ? ': ' + errorStr : ''}`;
    outputChannel?.appendLine(formatted);
    console.error(`[SysML Client] ${message}`, error);
}

/**
 * Normalize GitHub VFS URIs to a canonical form.
 * This matches the normalization done on the server side.
 */
function normalizeGitHubUri(uri: vscode.Uri): string {
    const uriString = uri.toString();

    // Check if this is a GitHub VFS URI
    if (!uriString.startsWith('vscode-vfs://github/') &&
        !uriString.startsWith('github://') &&
        !uriString.startsWith('github+')) {
        return uriString;
    }

    // Parse the URI
    try {
        const parsed = new URL(uriString);

        if (parsed.protocol === 'vscode-vfs:' && parsed.hostname === 'github') {
            // vscode-vfs://github/owner/repo/path → github://owner/repo/path
            const pathWithoutLeadingSlash = parsed.pathname.startsWith('/')
                ? parsed.pathname.slice(1)
                : parsed.pathname;
            const parts = pathWithoutLeadingSlash.split('/');
            if (parts.length >= 2) {
                const owner = parts[0];
                const rest = parts.slice(1).join('/');
                return `github://${owner}/${rest}`;
            }
        }
    } catch {
        // If parsing fails, return as-is
    }

    return uriString;
}

export async function startSysMLClient(context: vscode.ExtensionContext): Promise<void> {
    outputChannel = vscode.window.createOutputChannel('SysML v2 Language Server');
    outputChannel.appendLine('='.repeat(60));
    log('Starting SysML v2 Language Server (Browser)...');

    // Log environment info
    log(`vscode.env.appHost: ${vscode.env.appHost}`);
    log(`vscode.env.uiKind: ${vscode.env.uiKind === vscode.UIKind.Web ? 'Web' : 'Desktop'}`);

    // Path to language server module (bundled as worker)
    const serverMain = vscode.Uri.joinPath(context.extensionUri, 'dist/language-server/main.bundle.js');
    log(`Server bundle: ${serverMain.toString()}`);

    // Create worker
    const worker = new Worker(serverMain.toString());

    // Client options - sync SysML and KerML files
    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            { language: 'sysml' },
            { language: 'kerml' }
        ],
        outputChannel: outputChannel,
        traceOutputChannel: outputChannel
    };

    // Create and start language client
    client = new LanguageClient(
        'sysmlLanguageServer',
        'SysML v2 Language Server',
        clientOptions,
        worker
    );

    await client.start();
    log('Language client started successfully.');

    // Initialize workspace - discover and register files with server
    await initializeWorkspace();

    // Set up file watcher for new files
    setupFileWatcher(context);

    // Register commands
    registerCommands(context);
}

/**
 * Initialize workspace by discovering all SysML/KerML files and registering them.
 *
 * Flow:
 * 1. Wait for workspace folders to be available
 * 2. Find all SysML/KerML files
 * 3. Register them with the server (sysml/registerWorkspaceFiles)
 * 4. Open each file to trigger parsing/indexing
 */
async function initializeWorkspace(): Promise<void> {
    log('Initializing workspace...');

    // Wait for workspace folders to be available (event-driven, not polling)
    const folders = await waitForWorkspaceFolders();

    if (folders.length === 0) {
        log('No workspace folders available');
        return;
    }

    log(`Workspace folders: ${folders.map(f => f.uri.toString()).join(', ')}`);

    // Find all SysML/KerML files
    const startTime = Date.now();
    const files = await findWorkspaceFiles();

    if (files.length === 0) {
        log('No SysML/KerML files found in workspace');
        return;
    }

    log(`Found ${files.length} SysML/KerML files`);

    // =========================================================================
    // STEP 1: Register workspace files with server BEFORE opening
    // =========================================================================
    // This tells the server which files are "workspace documents" that should
    // persist on close (not be deleted from the registry).

    const normalizedUris = files.map(f => normalizeGitHubUri(f));
    log(`Registering ${normalizedUris.length} files as workspace documents...`);

    try {
        await client?.sendNotification('sysml/registerWorkspaceFiles', {
            files: normalizedUris
        });
        log('Workspace files registered with server');
    } catch (err) {
        logError('Failed to register workspace files', err);
    }

    // =========================================================================
    // STEP 2: Open each file to trigger parsing and indexing
    // =========================================================================
    log(`Opening ${files.length} files for server indexing...`);

    let openedCount = 0;
    let errorCount = 0;

    // Open files in batches to avoid overwhelming the system
    const BATCH_SIZE = 10;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (uri) => {
            try {
                // openTextDocument loads the file and fires onDidOpenTextDocument
                // The Language Client intercepts this and sends didOpen to server
                await vscode.workspace.openTextDocument(uri);
                openedCount++;
            } catch (error) {
                errorCount++;
                logError(`  Failed to open: ${uri.toString()}`, error);
            }
        }));

        // Log progress for large workspaces
        if (files.length > 20) {
            log(`  Progress: ${Math.min(i + BATCH_SIZE, files.length)}/${files.length} files`);
        }
    }

    // Give the server time to process the documents
    // The DocumentUpdateHandler debounces updates, so we need to wait
    log('Waiting for server to index documents...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const elapsed = Date.now() - startTime;
    log(`Workspace initialized: ${openedCount} files opened, ${errorCount} errors, ${elapsed}ms`);
    log('All files synced to server via standard LSP didOpen notifications');

    // Request workspace stats from server
    try {
        const stats = await client?.sendRequest('sysml/getWorkspaceStats');
        if (stats) {
            log(`Server stats: ${JSON.stringify(stats)}`);
        }
    } catch (err) {
        // Stats request is optional, ignore errors
    }
}

/**
 * Wait for workspace folders to be available.
 * Returns immediately if folders exist, otherwise waits for onDidChangeWorkspaceFolders event.
 * This is EVENT-DRIVEN, not polling!
 */
async function waitForWorkspaceFolders(): Promise<readonly vscode.WorkspaceFolder[]> {
    const folders = vscode.workspace.workspaceFolders;

    if (folders && folders.length > 0) {
        return folders;
    }

    log('Waiting for workspace folders...');

    // Wait for workspace folders via event (timeout after 30 seconds)
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            log('Timeout waiting for workspace folders');
            disposable.dispose();
            resolve([]);
        }, 30000);

        const disposable = vscode.workspace.onDidChangeWorkspaceFolders((event) => {
            if (event.added.length > 0) {
                log(`Workspace folders added: ${event.added.map(f => f.name).join(', ')}`);
                clearTimeout(timeout);
                disposable.dispose();
                resolve(vscode.workspace.workspaceFolders ?? []);
            }
        });
    });
}

/**
 * Find all SysML and KerML files in the workspace.
 * Includes a retry mechanism for slow VFS initialization.
 */
async function findWorkspaceFiles(): Promise<vscode.Uri[]> {
    // Try to find files
    let files = await vscode.workspace.findFiles(
        '**/*.{sysml,kerml}',
        '**/node_modules/**'
    );

    // If no files found, wait a bit and try once more
    // (VFS might need time to index after folders are available)
    if (files.length === 0) {
        log('No files found, waiting for VFS to index...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        files = await vscode.workspace.findFiles(
            '**/*.{sysml,kerml}',
            '**/node_modules/**'
        );
    }

    return files;
}

/**
 * Set up file system watcher for new SysML/KerML files.
 * When new files are created, we register and open them.
 */
function setupFileWatcher(context: vscode.ExtensionContext): void {
    log('Setting up file watcher...');

    fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{sysml,kerml}');

    // When a new file is created, register it as workspace document and open
    fileWatcher.onDidCreate(async (uri) => {
        log(`File created: ${uri.toString()}`);
        try {
            // Register with server first
            const normalizedUri = normalizeGitHubUri(uri);
            await client?.sendNotification('sysml/registerWorkspaceFiles', {
                files: [normalizedUri]
            });

            // Then open to trigger indexing
            await vscode.workspace.openTextDocument(uri);
        } catch (error) {
            logError(`Failed to register/open new file: ${uri.toString()}`, error);
        }
    });

    // File changes are handled automatically by the Language Client
    // (it listens to onDidChangeTextDocument for open documents)
    fileWatcher.onDidChange((uri) => {
        log(`File changed: ${uri.toString()}`);
    });

    // File deletions - notify server to remove from workspace URIs
    fileWatcher.onDidDelete((uri) => {
        log(`File deleted: ${uri.toString()}`);
        // The Language Client will send didClose when the document is closed
        // The server will handle removing it from the workspace URIs
    });

    context.subscriptions.push(fileWatcher);
    log('File watcher active');
}

export async function stopSysMLClient(): Promise<void> {
    if (fileWatcher) {
        fileWatcher.dispose();
        fileWatcher = undefined;
    }

    if (client) {
        await client.stop();
        client = undefined;
    }
}

function registerCommands(context: vscode.ExtensionContext): void {
    // Restart server command
    context.subscriptions.push(
        vscode.commands.registerCommand('sysml.restartServer', async () => {
            if (client) {
                log('Restarting language server...');
                await client.stop();
                client = undefined;
                await startSysMLClient(context);
                vscode.window.showInformationMessage('SysML Language Server restarted');
            }
        })
    );

    // Rescan workspace command
    context.subscriptions.push(
        vscode.commands.registerCommand('sysml.rescanWorkspace', async () => {
            log('Manual workspace rescan requested');
            await initializeWorkspace();
            vscode.window.showInformationMessage('SysML workspace scan complete');
        })
    );

    // Show workspace stats command
    context.subscriptions.push(
        vscode.commands.registerCommand('sysml.showWorkspaceStats', async () => {
            try {
                const stats = await client?.sendRequest('sysml/getWorkspaceStats');
                if (stats) {
                    const message = `Documents: ${(stats as any).totalDocuments} total, ` +
                        `${(stats as any).workspaceDocuments} workspace, ` +
                        `${(stats as any).stdlibDocuments} stdlib, ` +
                        `${(stats as any).registeredWorkspaceUris} registered URIs`;
                    vscode.window.showInformationMessage(message);
                    log(`Workspace stats: ${JSON.stringify(stats)}`);
                }
            } catch (err) {
                logError('Failed to get workspace stats', err);
            }
        })
    );

    // Show model structure command
    context.subscriptions.push(
        vscode.commands.registerCommand('sysml.showModel', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || (editor.document.languageId !== 'sysml' && editor.document.languageId !== 'kerml')) {
                vscode.window.showErrorMessage('Not a SysML/KerML file');
                return;
            }

            const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                editor.document.uri
            );

            if (symbols && symbols.length > 0) {
                const tree = buildSymbolTree(symbols);
                const panel = vscode.window.createWebviewPanel(
                    'sysmlModel',
                    'SysML Model Structure',
                    vscode.ViewColumn.Two,
                    {}
                );
                panel.webview.html = generateModelView(tree);
            }
        })
    );
}

function buildSymbolTree(symbols: vscode.DocumentSymbol[]): string {
    const lines: string[] = [];

    function traverse(symbol: vscode.DocumentSymbol, indent: number = 0): void {
        const prefix = '  '.repeat(indent);
        const kindIcon = getSymbolIcon(symbol.kind);
        lines.push(`${prefix}${kindIcon} ${symbol.name} ${symbol.detail || ''}`);

        if (symbol.children) {
            for (const child of symbol.children) {
                traverse(child, indent + 1);
            }
        }
    }

    for (const symbol of symbols) {
        traverse(symbol);
    }

    return lines.join('\n');
}

function getSymbolIcon(kind: vscode.SymbolKind): string {
    const icons: Record<number, string> = {
        [vscode.SymbolKind.Package]: '[PKG]',
        [vscode.SymbolKind.Class]: '[CLS]',
        [vscode.SymbolKind.Method]: '[MTD]',
        [vscode.SymbolKind.Property]: '[PRP]',
        [vscode.SymbolKind.Field]: '[FLD]',
        [vscode.SymbolKind.Interface]: '[INT]',
        [vscode.SymbolKind.Enum]: '[ENM]'
    };
    return icons[kind] || '[*]';
}

function generateModelView(tree: string): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Courier New', monospace;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        pre {
            white-space: pre-wrap;
            line-height: 1.6;
        }
        h1 {
            color: var(--vscode-titleBar-activeForeground);
            border-bottom: 2px solid var(--vscode-titleBar-border);
            padding-bottom: 10px;
        }
    </style>
</head>
<body>
    <h1>SysML Model Structure</h1>
    <pre>${tree}</pre>
</body>
</html>`;
}
