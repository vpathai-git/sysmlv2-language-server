import * as vscode from 'vscode';

let stopSysMLClient: (() => Promise<void>) | null = null;

export async function activate(context: vscode.ExtensionContext) {
    // Start SysML Language Client (creates its own output channel "SysML v2 Language Server")
    try {
        if (vscode.env.uiKind === vscode.UIKind.Web) {
            const module = await import('./sysml/browserClient.js');
            await module.startSysMLClient(context);
            stopSysMLClient = module.stopSysMLClient;
        } else {
            const module = await import('./sysml/client.js');
            await module.startSysMLClient(context);
            stopSysMLClient = module.stopSysMLClient;
        }
    } catch (e: any) {
        vscode.window.showErrorMessage(`Failed to start SysML Client: ${e.message}`);
    }
}

export function deactivate() {
    if (stopSysMLClient) {
        stopSysMLClient();
    }
}
