import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const watch = process.argv.includes('--watch');

// Output to extension's dist/language-server folder for Node.js version
const outfile = '../../../dist/language-server/main-node.bundle.js';

const ctx = await esbuild.context({
    entryPoints: ['src/main.ts'],
    outfile: outfile,
    bundle: true,
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    sourcemap: true,
    minify: false,
    treeShaking: false,  // Preserve console statements in startServer()
    keepNames: true      // Preserve function names for debugging
});

if (watch) {
    await ctx.watch();
    console.log('Watching for changes...');
} else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log('Node.js build complete:', outfile);
}
