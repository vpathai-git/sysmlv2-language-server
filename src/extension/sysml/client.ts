import * as path from 'path';
import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;
let outputChannel: vscode.OutputChannel | undefined;

export async function startSysMLClient(context: vscode.ExtensionContext): Promise<void> {
    // Create output channel for server logs
    outputChannel = vscode.window.createOutputChannel('SysML v2 Language Server');
    outputChannel.appendLine('[Client] Starting SysML v2 Language Server...');

    // Path to language server module
    const serverModule = context.asAbsolutePath(
        path.join('dist', 'language-server', 'main-node.bundle.js')
    );

    outputChannel.appendLine(`[Client] Server module: ${serverModule}`);

    // Server options
    const serverOptions: ServerOptions = {
        run: {
            module: serverModule,
            transport: TransportKind.ipc
        },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: {
                execArgv: ['--nolazy', '--inspect=6009']
            }
        }
    };

    // Client options - use our output channel for server messages
    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'sysml' },
            { scheme: 'file', language: 'kerml' },
            { scheme: 'file', pattern: '**/*.sysml' },
            { scheme: 'file', pattern: '**/*.kerml' }
        ],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.{sysml,kerml}')
        },
        outputChannel: outputChannel,
        traceOutputChannel: outputChannel
    };

    // Create and start language client
    client = new LanguageClient(
        'sysmlLanguageServer',
        'SysML v2 Language Server',
        serverOptions,
        clientOptions
    );

    await client.start();
    outputChannel.appendLine('[Client] Language client started successfully.');

    registerCommands(context);
}

export async function stopSysMLClient(): Promise<void> {
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
                await client.stop();
                client = undefined;
                await startSysMLClient(context);
                vscode.window.showInformationMessage('SysML Language Server restarted');
            }
        })
    );

    // Show model structure command
    context.subscriptions.push(
        vscode.commands.registerCommand('sysml.showModel', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'sysml') {
                vscode.window.showErrorMessage('Not a SysML file');
                return;
            }

            // Get document symbols to show structure
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
        [vscode.SymbolKind.Package]: '📦',
        [vscode.SymbolKind.Class]: '🔷',
        [vscode.SymbolKind.Method]: '⚙️',
        [vscode.SymbolKind.Property]: '🔹',
        [vscode.SymbolKind.Field]: '📝',
        [vscode.SymbolKind.Interface]: '🔌',
        [vscode.SymbolKind.Enum]: '📋'
    };
    return icons[kind] || '•';
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
