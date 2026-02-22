const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

const esbuildProblemMatcherPlugin = {
    name: 'esbuild-problem-matcher',
    setup(build) {
        build.onStart(() => {
            console.log('[watch] build started');
        });
        build.onEnd((result) => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                console.error(`    ${location.file}:${location.line}:${location.column}:`);
            });
            console.log('[watch] build finished');
        });
    },
};

const nodePolyfillPlugin = {
    name: 'node-polyfill',
    setup(build) {
        // Stub browser client for Node build
        build.onResolve({ filter: /sysml\/browserClient\.js$/ }, args => {
            return { path: args.path, namespace: 'stub-browser-client' };
        });
        build.onLoad({ filter: /.*/, namespace: 'stub-browser-client' }, args => {
            return { contents: 'export async function startSysMLClient() {}; export async function stopSysMLClient() {};' };
        });
    }
};

const browserPolyfillPlugin = {
    name: 'browser-polyfill',
    setup(build) {
        // Stub Node client for Browser build
        build.onResolve({ filter: /sysml\/client\.js$/ }, args => {
            return { path: args.path, namespace: 'stub-node-client' };
        });
        build.onLoad({ filter: /.*/, namespace: 'stub-node-client' }, args => {
            return { contents: 'export async function startSysMLClient() {}; export async function stopSysMLClient() {};' };
        });
    }
};

async function main() {
    // Node Build - outputs to dist/extension.js (matches package.json "main")
    const ctx = await esbuild.context({
        entryPoints: ['src/extension/extension.ts'],
        bundle: true,
        format: 'cjs',
        minify: production,
        sourcemap: !production,
        sourcesContent: false,
        platform: 'node',
        outfile: 'dist/extension.js',
        external: ['vscode'],
        logLevel: 'silent',
        plugins: [
            esbuildProblemMatcherPlugin,
            nodePolyfillPlugin
        ],
    });

    // Web Build - outputs to dist/web/extension.js (matches package.json "browser")
    const webCtx = await esbuild.context({
        entryPoints: ['src/extension/extension.ts'],
        bundle: true,
        format: 'cjs',
        minify: production,
        sourcemap: !production,
        sourcesContent: false,
        platform: 'browser',
        outfile: 'dist/web/extension.js',
        external: ['vscode'],
        logLevel: 'silent',
        plugins: [
            esbuildProblemMatcherPlugin,
            browserPolyfillPlugin
        ],
    });

    if (watch) {
        await ctx.watch();
        await webCtx.watch();
    } else {
        await ctx.rebuild();
        await webCtx.rebuild();
        await ctx.dispose();
        await webCtx.dispose();
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
