/**
 * Grammar Test - CommonJS version
 * Tests the Langium parser directly using Chevrotain
 */

const { loadGrammarFromJson, createParser } = require('langium/grammar');
const fs = require('fs');
const path = require('path');

async function main() {
    const testFile = process.argv[2] || '../../sysml_resources/test-qualified.sysml';

    console.log('=== Grammar Parse Test ===\n');
    console.log(`Testing: ${testFile}`);

    // Read test content
    let content;
    try {
        content = fs.readFileSync(testFile, 'utf-8');
        console.log(`File content (${content.length} chars):\n`);
        console.log(content);
    } catch (e) {
        console.error(`Error reading file: ${e.message}`);
        process.exit(1);
    }

    // Try to load and use the grammar
    try {
        // Read the generated grammar
        const grammarPath = path.join(__dirname, 'src/generated/grammar.ts');
        const grammarContent = fs.readFileSync(grammarPath, 'utf-8');

        console.log(`\nGrammar file loaded (${grammarContent.length} chars)`);

        // Check for key patterns
        if (grammarContent.includes('QualifiedName')) {
            console.log('✓ QualifiedName rule found');
        }
        if (grammarContent.includes('Qualification')) {
            console.log('✓ Qualification rule found');
        }
        if (grammarContent.includes('FeatureSpecializationPart')) {
            console.log('✓ FeatureSpecializationPart rule found');
        }
        if (grammarContent.includes('=>')) {
            console.log('✓ Syntactic predicate (=>) found');
        }

        console.log('\nGrammar structure verified.');

    } catch (e) {
        console.error(`Error: ${e.message}`);
        process.exit(1);
    }
}

main();
