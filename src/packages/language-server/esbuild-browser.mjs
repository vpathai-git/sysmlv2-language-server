import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';

const watch = process.argv.includes('--watch');

// Get build version from extension's package.json
let buildVersion = 'dev';
let buildTimestamp = new Date().toISOString();
try {
    const pkgPath = path.resolve('../../../package.json');
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        buildVersion = pkg.version || 'dev';
    }
} catch (e) {
    console.warn('[Browser] Could not read package.json for version');
}
console.log(`[Browser] Build version: ${buildVersion}, timestamp: ${buildTimestamp}`);

// Read all stdlib files at build time and embed them in the bundle
const stdlibDir = path.resolve('stdlib');
const stdlibFiles = {};
let stdlibCount = 0;

if (fs.existsSync(stdlibDir)) {
    for (const file of fs.readdirSync(stdlibDir)) {
        if (file.endsWith('.kerml') || file.endsWith('.sysml')) {
            stdlibFiles[file] = fs.readFileSync(path.join(stdlibDir, file), 'utf-8');
            stdlibCount++;
        }
    }
    console.log(`[Browser] Embedding ${stdlibCount} stdlib files in bundle`);
} else {
    console.warn('[Browser] Warning: stdlib directory not found at', stdlibDir);
}

const ctx = await esbuild.context({
    entryPoints: ['src/browser-main.ts'],
    outfile: '../../../dist/language-server/main.bundle.js', // Output to extension's dist/language-server folder
    bundle: true,
    external: ['vscode'], // vscode-languageserver/browser doesn't depend on vscode, but just in case
    format: 'iife', // Web Worker needs a script, IIFE is good. Or 'esm' if using module workers.
    platform: 'browser',
    sourcemap: true,
    minify: false,
    define: {
        process: '{"env":{}}', // Polyfill process for some libs
        'EMBEDDED_STDLIB': JSON.stringify(stdlibFiles),  // Must match declaration in browser-stdlib-loader.ts
        'BUILD_VERSION': JSON.stringify(buildVersion),
        'BUILD_TIMESTAMP': JSON.stringify(buildTimestamp)
    },
    plugins: [
        {
            name: 'alias',
            setup(build) {
                // Alias vscode-languageserver/node to browser (if any accidental imports)
                build.onResolve({ filter: /^vscode-languageserver\/node$/ }, args => {
                    return { path: 'vscode-languageserver/browser' };
                });
                // Stub fs, path, url
                build.onResolve({ filter: /^(fs|path|url)$/ }, args => {
                    return { path: args.path, namespace: 'stub-node' };
                });
                build.onLoad({ filter: /.*/, namespace: 'stub-node' }, args => {
                    return { contents: 'export default {}; export const fileURLToPath = () => ""; export const dirname = () => ""; export const resolve = () => ""; export const join = () => ""; export const existsSync = () => false;' };
                });
            }
        }
    ]
});

if (watch) {
    await ctx.watch();
    console.log('Watching for changes...');
} else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log('Browser build complete');
}
