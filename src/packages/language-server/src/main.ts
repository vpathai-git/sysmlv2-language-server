/**
 * SysML v2 Language Server
 *
 * This is the main entry point for the Language Server Protocol implementation.
 * It provides IDE features like IntelliSense, validation, navigation, etc.
 */

import { startLanguageServer } from 'langium/lsp';
import { NodeFileSystem } from 'langium/node';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js';
import { createSysMLServices } from './sysml-module.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';

// Export for testing and programmatic use
export { createSysMLServices } from './sysml-module.js';
export { loadStandardLibrary } from './stdlib-loader.js';
export type { StdlibLoadResult, StdlibLoadOptions } from './stdlib-loader.js';

/**
 * Build information for debugging and version tracking
 */
interface BuildInfo {
    buildId: number;
    version: string;
    timestamp: string;
    gitCommit?: string;
    gitBranch?: string;
}

/**
 * Load build info from build-info.json
 */
function loadBuildInfo(): BuildInfo | null {
    try {
        // Try multiple possible locations for build-info.json
        const possiblePaths = [
            // From bundled location: dist/server/main-node.bundle.js -> dist/build-info.json
            join(dirname(process.argv[1] || ''), '..', 'build-info.json'),
            join(dirname(process.argv[1] || ''), '..', '..', 'build-info.json'),
            // From development location
            join(process.cwd(), 'dist', 'build-info.json'),
            join(process.cwd(), 'build-info.json'),
        ];

        for (const p of possiblePaths) {
            if (existsSync(p)) {
                const content = readFileSync(p, 'utf-8');
                return JSON.parse(content) as BuildInfo;
            }
        }
        return null;
    } catch {
        return null;
    }
}

const BUILD_INFO = loadBuildInfo();

process.on('uncaughtException', (err) => {
    console.error('[SysML] Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[SysML] Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

/**
 * Suppress Chevrotain's "Ambiguous Alternatives Detected" warnings during parser construction.
 * These are informational warnings about grammar ambiguities that are resolved at runtime.
 * They clutter the output channel and hide useful status messages.
 */
function suppressChevrotainWarnings<T>(fn: () => T): T {
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
        const msg = String(args[0] || '');
        // Only suppress Chevrotain ambiguity warnings
        if (msg.includes('Ambiguous Alternatives Detected') ||
            msg.includes('may appears as a prefix path') ||
            msg.includes('AMBIGUOUS_ALTERNATIVES')) {
            return; // Suppress
        }
        originalLog.apply(console, args);
    };
    try {
        return fn();
    } finally {
        console.log = originalLog;
    }
}

/**
 * Format build info for display
 */
function formatBuildInfo(): string {
    if (BUILD_INFO) {
        return `Build #${BUILD_INFO.buildId} | v${BUILD_INFO.version} | ${BUILD_INFO.timestamp}`;
    }
    return 'Build: unknown (build-info.json not found)';
}

/**
 * Start the language server (called when run as a standalone process)
 */
export function startServer(): void {
    try {
        // Create LSP connection first
        const connection = createConnection(ProposedFeatures.all);

        // Create SysML language services (suppress Chevrotain grammar warnings)
        const { shared } = suppressChevrotainWarnings(() =>
            createSysMLServices({ connection, ...NodeFileSystem })
        );

        // Register onInitialized handler to log startup info to output channel
        connection.onInitialized(() => {
            // These messages will appear in VS Code's "SysML v2 Language Server" output channel
            connection.console.log('═'.repeat(60));
            connection.console.log(`[SysML] ${formatBuildInfo()}`);
            connection.console.log('═'.repeat(60));
            connection.console.log('[SysML] Language Server initialized and ready.');
        });

        // Start the language server
        startLanguageServer(shared);

    } catch (err) {
        // This goes to stderr - visible in debug console if launching with --inspect
        console.error('[SysML] FATAL ERROR in startServer:', err);
    }
}

// Auto-start the server when module is loaded as main
// Note: import.meta check doesn't work in bundled CommonJS, so we check if module is being run directly
if (typeof require !== 'undefined' && require.main === module) {
    console.error('[SysML] Auto-starting via require.main === module');
    startServer();
} else if (typeof process !== 'undefined' && process.argv[1] &&
           (process.argv[1].endsWith('main-node.bundle.js') ||
            process.argv[1].endsWith('main.bundle.js'))) {
    // Fallback: start if this looks like the main entry point
    console.error('[SysML] Auto-starting via process.argv check');
    startServer();
}
