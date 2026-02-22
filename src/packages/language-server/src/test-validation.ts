/**
 * OFFLINE VALIDATION TEST
 * Tests validation directly using Langium services without LSP
 */

import { NodeFileSystem } from 'langium/node';
import { createSysMLServices } from './sysml-module.js';
import { URI } from 'langium';

console.log('════════════════════════════════════════════════════════════════');
console.log('  🧪 OFFLINE VALIDATION TEST');
console.log('  Testing validation without LSP/VS Code integration');
console.log('════════════════════════════════════════════════════════════════\n');

// Test documents
const tests = [
    {
        name: 'VALID - Should have NO errors',
        content: `package Valid {
    part def Motor {
        attribute power : Real = 100.0;
        attribute speed : Integer = 3000;
    }
}`,
        expectedErrors: 0
    },
    {
        name: 'INVALID TYPE - NonExistentType should error',
        content: `package InvalidType {
    part def Motor {
        attribute power : NonExistentType = 100.0;
    }
}`,
        expectedErrors: 1,
        expectedMessage: 'NonExistentType'
    },
    {
        name: 'MISSING TYPE - No type specified',
        content: `package MissingType {
    part def Motor {
        attribute power = 100.0;
    }
}`,
        expectedErrors: 1,
        expectedMessage: 'must have a type'
    },
    {
        name: 'MULTIPLE ERRORS',
        content: `package MultiError {
    part def Motor {
        attribute power : BadType = 100.0;
        attribute speed : AnotherBadType = 3000;
        attribute noType = 5;
    }
}`,
        expectedErrors: 3  // 2 bad types + 1 missing type
    }
];

// Create services without connection for offline testing
console.log('📦 Creating SysML services...');
const services = createSysMLServices(NodeFileSystem).SysML;
const documentFactory = services.shared.workspace.LangiumDocumentFactory;
const documentBuilder = services.shared.workspace.DocumentBuilder;

console.log('✅ Services created\n');

// Check validation configuration
console.log('🔍 Checking validation configuration:');

// Check ValidationRegistry
const validationRegistry = services.validation?.ValidationRegistry;
if (validationRegistry) {
    console.log('   ✅ ValidationRegistry exists');

    // Try to check for registered validators
    const registryAny = validationRegistry as any;
    if (registryAny.AttributeUsage) {
        console.log('   ✅ AttributeUsage validator registered');
    } else {
        console.log('   ❌ No AttributeUsage validator found');
    }
} else {
    console.log('   ❌ No ValidationRegistry found!');
}

// Check DocumentValidator
const validator = services.validation?.DocumentValidator;
if (validator) {
    console.log('   ✅ DocumentValidator exists');
} else {
    console.log('   ❌ No DocumentValidator found!');
}

console.log('\n' + '─'.repeat(64) + '\n');

// Run tests
async function runTest(test: any, index: number) {
    console.log(`TEST ${index + 1}/${tests.length}: ${test.name}`);
    console.log('─'.repeat(40));

    // Create document
    const uri = URI.parse(`file:///test${index}.sysml`);
    const document = documentFactory.fromString(test.content, uri);

    console.log('📄 Document created');

    // Build document (parse, link, validate)
    await documentBuilder.build([document], { validation: true });

    console.log('🔨 Document built');

    // Check parse errors
    const parseErrors = document.parseResult.lexerErrors.length +
                        document.parseResult.parserErrors.length;

    if (parseErrors > 0) {
        console.log(`⚠️  Parse errors: ${parseErrors}`);
        document.parseResult.lexerErrors.forEach(err => {
            console.log(`   Lexer: ${err.message}`);
        });
        document.parseResult.parserErrors.forEach(err => {
            console.log(`   Parser at line ${err.token.startLine}: ${err.message}`);
        });
    }

    // Get diagnostics
    const diagnostics = document.diagnostics || [];

    console.log(`\n📊 Results:`);
    console.log(`   Expected errors: ${test.expectedErrors}`);
    console.log(`   Actual errors: ${diagnostics.length}`);

    if (diagnostics.length > 0) {
        console.log('\n   Diagnostics:');
        diagnostics.forEach((diag: any, i: number) => {
            const line = diag.range.start.line + 1;
            const col = diag.range.start.character + 1;
            console.log(`   ${i + 1}. Line ${line}:${col} - ${diag.severity}: ${diag.message}`);

            // Show the problematic line
            const lines = test.content.split('\n');
            if (lines[diag.range.start.line]) {
                console.log(`      > ${lines[diag.range.start.line]}`);
                console.log(`        ${' '.repeat(diag.range.start.character)}^`);
            }
        });
    } else if (test.expectedErrors > 0) {
        console.log('\n   ⚠️  NO ERRORS DETECTED - Validation may not be working!');

        // Try manual validation
        console.log('\n   🔧 Attempting manual validation...');

        if (validator) {
            await validator.validateDocument(document, {
                categories: ['all'],
                stopAfterFirstError: false
            } as any);

            const afterManual = document.diagnostics || [];
            console.log(`   After manual validation: ${afterManual.length} diagnostics`);

            if (afterManual.length > 0) {
                console.log('   ✅ Manual validation worked! Issue: Auto-validation not triggered.');
            } else {
                console.log('   ❌ Even manual validation found no errors.');
            }
        }
    }

    // Check if test passed
    const passed = diagnostics.length === test.expectedErrors;
    console.log(`\n   Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);

    console.log('');
    return {
        name: test.name,
        passed,
        expected: test.expectedErrors,
        actual: diagnostics.length
    };
}

// Run all tests
async function runAllTests() {
    const results: any[] = [];

    for (let i = 0; i < tests.length; i++) {
        const result = await runTest(tests[i], i);
        results.push(result);
    }

    // Summary
    console.log('════════════════════════════════════════════════════════════════');
    console.log('  📊 FINAL SUMMARY');
    console.log('════════════════════════════════════════════════════════════════\n');

    const passed = results.filter(r => r.passed).length;
    console.log(`Tests Passed: ${passed}/${results.length}\n`);

    results.forEach(r => {
        const status = r.passed ? '✅' : '❌';
        console.log(`${status} ${r.name}`);
        console.log(`   Expected: ${r.expected}, Got: ${r.actual}`);
    });

    console.log('\n' + '─'.repeat(64));

    if (passed === results.length) {
        console.log('\n🎉 ALL TESTS PASSED! Validation is working correctly.');
        console.log('   Error detection: ✅');
        console.log('   Type validation: ✅');
        console.log('   Diagnostics: ✅');
    } else if (results.every(r => r.actual === 0)) {
        console.log('\n❌ CRITICAL: Validation is NOT being triggered!');
        console.log('   The DocumentBuilder is not running validation automatically.');
        console.log('   Validators are registered but not being called.');
        console.log('\n   Solution: Need to configure DocumentBuilder to trigger validation.');
    } else {
        console.log('\n⚠️  Some tests failed. Partial validation may be working.');
    }

    console.log('');
    process.exit(passed === results.length ? 0 : 1);
}

// Run tests
runAllTests().catch(console.error);