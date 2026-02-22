/**
 * SysML Diagnostic Message Provider
 *
 * Provides simplified, user-friendly error messages for common syntax errors.
 * Instead of showing long lists of expected tokens, this provider detects
 * common patterns (missing braces, semicolons, etc.) and provides clear messages.
 *
 * Rationale: Custom UX improvement. Default Langium/Chevrotain parser error messages
 * are verbose and unhelpful. This implementation improves on defaults by:
 * 1. Detecting common syntax error patterns and providing actionable messages
 * 2. Truncating verbose "Expecting one of N token sequences" to show only first 3
 * 3. Providing SysML-specific hints for common mistakes (ERR-001 through ERR-004)
 *
 * Based on:
 * - Langium patterns: https://langium.org/docs/reference/parser/
 * - Chevrotain IParserErrorMessageProvider: https://chevrotain.io/docs/guide/custom_errors.html
 * - ACM SIGPLAN 2019: "What Makes a Good Error Message?"
 * - KerMLExpressions grammar (operator syntax)
 * - SysML grammar (alias, use case, actor syntax)
 *
 * To disable: Set ENABLE_SIMPLIFIED_DIAGNOSTICS to false
 */

import { LangiumParserErrorMessageProvider } from 'langium';
import type { IToken, TokenType } from 'chevrotain';

/**
 * Toggle to enable/disable simplified diagnostic messages.
 * Set to false to revert to default Langium behavior.
 */
export const ENABLE_SIMPLIFIED_DIAGNOSTICS = true;

/**
 * Custom parser error message provider that simplifies parser error messages.
 *
 * When the parser encounters unexpected tokens, it typically lists all possible
 * valid tokens, which can be overwhelming. This provider detects common syntax
 * errors and provides more helpful messages.
 */
export class SysMLParserErrorMessageProvider extends LangiumParserErrorMessageProvider {
    /**
     * Maximum message length before considering simplification
     */
    private readonly SIMPLIFICATION_THRESHOLD = 150;

    /**
     * Maximum number of alternatives to show in "No Viable Alternative" errors
     * ADR-004: Truncate verbose error messages for better UX
     */
    private readonly MAX_ALTERNATIVES_SHOWN = 3;

    override buildMismatchTokenMessage(options: any): string {
        // ERR-002: Check for alias 'as' instead of 'for' pattern
        // Reference: SysML grammar, Spec 07.05.02
        const expected = options.expected;
        const actual = options.actual;
        // Note: options.previous available for future use if needed

        // Detect alias syntax error: user typed 'alias X as Y' instead of 'alias Y for X'
        // The expected token name can be 'for:KW' or just contain 'for'
        const expectedName = expected?.name?.toLowerCase() ?? '';
        const actualImage = actual?.image ?? '';
        if ((expectedName === 'for:kw' || expectedName === 'for') && actualImage === '::') {
            return "Syntax error: Alias syntax is 'alias Name for QualifiedName'.\n" +
                   "Wrong:   alias ISQ::TorqueValue as Torque;\n" +
                   "Correct: alias Torque for ISQ::TorqueValue;";
        }

        // Get the default message first
        const defaultMessage = super.buildMismatchTokenMessage(options);

        // Only simplify long messages
        if (this.shouldSimplify(defaultMessage)) {
            const simplified = this.simplifyMessage(defaultMessage);
            if (simplified) {
                return simplified;
            }
        }

        // Return original message for everything else
        return defaultMessage;
    }

    /**
     * Override buildNoViableAltMessage to truncate verbose token sequence lists.
     * ADR-004: Instead of listing 50+ possible token sequences, show first 3 + count.
     *
     * Default Chevrotain output:
     *   Expecting: one of these possible Token sequences:
     *     1. [public]
     *     2. [private]
     *     ... (50 more lines)
     *   but found: 'action'
     *
     * Our improved output:
     *   Expecting: one of these possible Token sequences:
     *     1. [public]
     *     2. [private]
     *     3. [protected]
     *     ... (47 more options)
     *   but found: 'action'
     */
    override buildNoViableAltMessage(options: {
        expectedPathsPerAlt: TokenType[][][];
        actual: IToken[];
        previous: IToken;
        customUserDescription: string;
        ruleName: string;
    }): string {
        const { expectedPathsPerAlt, actual, previous, customUserDescription } = options;

        const errPrefix = 'Expecting: ';
        const actualText = actual[0]?.image ?? '';
        const errSuffix = `\nbut found: '${actualText}'`;

        // If there's a custom description, use it (unchanged behavior)
        if (customUserDescription) {
            return errPrefix + customUserDescription + errSuffix;
        }

        // ERR-001: Check for C-style logical operators (SysML uses 'and'/'or' keywords)
        // Reference: KerMLExpressions grammar
        const sysmlHint = this.getSysMLSpecificHint(actual, previous);
        if (sysmlHint) {
            return sysmlHint;
        }

        // Flatten all alternatives into one list
        const allPaths: TokenType[][] = [];
        for (const altPaths of expectedPathsPerAlt) {
            for (const path of altPaths) {
                allPaths.push(path);
            }
        }

        const totalCount = allPaths.length;

        // If few enough alternatives, show them all
        if (totalCount <= this.MAX_ALTERNATIVES_SHOWN + 1) {
            // Use default behavior for small lists
            return super.buildNoViableAltMessage(options);
        }

        // Build truncated list
        const shownPaths = allPaths.slice(0, this.MAX_ALTERNATIVES_SHOWN);
        const remainingCount = totalCount - this.MAX_ALTERNATIVES_SHOWN;

        const pathStrings = shownPaths.map((path, idx) => {
            const tokenLabels = path.map(tokenType => this.getTokenLabel(tokenType));
            return `  ${idx + 1}. [${tokenLabels.join(', ')}]`;
        });

        // Add truncation indicator
        pathStrings.push(`  ... (${remainingCount} more options)`);

        const calculatedDescription = `one of these possible Token sequences:\n${pathStrings.join('\n')}`;
        return errPrefix + calculatedDescription + errSuffix;
    }

    /**
     * ERR-001 through ERR-005: SysML-specific error hints for common syntax mistakes.
     *
     * Detects patterns that indicate users are using non-standard syntax and provides
     * actionable error messages with examples of correct syntax.
     *
     * References:
     * - ERR-001: KerMLExpressions grammar (and/or operators)
     * - ERR-002: SysML grammar (alias syntax)
     * - ERR-003: SysML grammar (use case keyword)
     * - ERR-004: SysML grammar (actor in CaseBody only)
     * - ERR-005: Unit annotation syntax (non-standard '@[unit]' pattern)
     */
    private getSysMLSpecificHint(actual: IToken[], previous: IToken): string | null {
        const actualToken = actual[0]?.image;
        const prevToken = previous?.image;

        // ERR-001: C-style logical operators '&&' and '||'
        // SysML uses 'and' and 'or' keywords instead
        if (actualToken === '&' || actualToken === '&&') {
            return "Syntax error: Use 'and' instead of '&&'.\n" +
                   "SysML uses keyword operators: 'and', 'or', 'not', 'implies'.\n" +
                   "Example: x > 0 and y < 10";
        }
        if (actualToken === '|' || actualToken === '||') {
            return "Syntax error: Use 'or' instead of '||'.\n" +
                   "SysML uses keyword operators: 'and', 'or', 'not', 'implies'.\n" +
                   "Example: x < 0 or x > 100";
        }

        // ERR-005: '@[unit]' instead of '[unit]' (non-standard pattern)
        // Parser sees '@' then '[' as separate tokens, fails on '['
        if (actualToken === '[' && prevToken === '@') {
            return "Syntax error: Use '[unit]' instead of '@[unit]'.\n" +
                   "The '@[unit]' pattern is not standard SysML v2.\n" +
                   "Wrong:   attribute mass = 75 @[kg];\n" +
                   "Correct: attribute mass = 75 [kg];";
        }

        // ERR-003: 'usecase' (one word) instead of 'use case' (two words)
        // The parser sees 'usecase' as an identifier and fails on the next token
        if (prevToken?.toLowerCase() === 'usecase') {
            return "Syntax error: Use 'use case' (two separate words) instead of 'usecase'.\n" +
                   "Example: use case 'perform action' { subject s; actor a : Person; }";
        }

        // ERR-004: 'actor' at wrong position (likely at package level)
        // Actor declarations are only valid inside CaseBody (use case, etc.)
        // When parser expects '}' but finds 'actor', user likely put actor at package level
        if (actualToken === 'actor') {
            return "Syntax error: 'actor' declarations are only valid inside use case bodies.\n" +
                   "Wrong:   package P { actor Doctor; }\n" +
                   "Correct: package P { use case UC { actor doctor : Person; } }";
        }

        return null;
    }

    /**
     * Override buildEarlyExitMessage to truncate verbose iteration path lists.
     * ADR-004: Same truncation pattern as buildNoViableAltMessage.
     *
     * Default Chevrotain output:
     *   Expecting: expecting at least one iteration which starts with one of these possible Token sequences::
     *     <[public], [private], [protected], ... (hundreds more)>
     *   but found: 'something'
     *
     * Our improved output:
     *   Expecting: at least one of:
     *     1. [public]
     *     2. [private]
     *     3. [protected]
     *     ... (47 more options)
     *   but found: 'something'
     */
    override buildEarlyExitMessage(options: {
        expectedIterationPaths: TokenType[][];
        actual: IToken[];
        previous: IToken;
        customUserDescription: string;
        ruleName: string;
    }): string {
        const { expectedIterationPaths, actual, customUserDescription } = options;

        const errPrefix = 'Expecting: ';
        const actualText = actual[0]?.image ?? '';
        const errSuffix = `\nbut found: '${actualText}'`;

        // If there's a custom description, use it (unchanged behavior)
        if (customUserDescription) {
            return errPrefix + customUserDescription + errSuffix;
        }

        const totalCount = expectedIterationPaths.length;

        // If few enough alternatives, use default behavior
        if (totalCount <= this.MAX_ALTERNATIVES_SHOWN + 1) {
            return super.buildEarlyExitMessage(options);
        }

        // Build truncated list
        const shownPaths = expectedIterationPaths.slice(0, this.MAX_ALTERNATIVES_SHOWN);
        const remainingCount = totalCount - this.MAX_ALTERNATIVES_SHOWN;

        const pathStrings = shownPaths.map((path, idx) => {
            const tokenLabels = path.map(tokenType => this.getTokenLabel(tokenType));
            return `  ${idx + 1}. [${tokenLabels.join(', ')}]`;
        });

        // Add truncation indicator
        pathStrings.push(`  ... (${remainingCount} more options)`);

        const calculatedDescription = `at least one of:\n${pathStrings.join('\n')}`;
        return errPrefix + calculatedDescription + errSuffix;
    }

    /**
     * Get a readable label for a token type.
     * Handles keyword tokens (ending with :KW) specially.
     */
    private getTokenLabel(tokenType: TokenType): string {
        if (tokenType.LABEL) {
            return tokenType.LABEL;
        }
        if (tokenType.name.endsWith(':KW')) {
            // Convert "public:KW" to "public"
            return tokenType.name.slice(0, -3);
        }
        return tokenType.name;
    }

    /**
     * Determines if a message should be simplified
     */
    private shouldSimplify(message: string): boolean {
        return (
            message.includes('expecting') &&
            message.length > this.SIMPLIFICATION_THRESHOLD
        );
    }

    /**
     * Attempts to simplify a parser error message by detecting common patterns
     */
    private simplifyMessage(message: string): string | null {
        // Check for missing closing brace
        if (message.includes("'}'")) {
            return 'Syntax error: possibly missing closing brace }';
        }

        // Check for missing opening brace
        if (message.includes("'{'")) {
            return 'Syntax error: possibly missing opening brace {';
        }

        // Check for missing semicolon
        if (message.includes("';'")) {
            return 'Syntax error: possibly missing semicolon ;';
        }

        // Check for missing closing parenthesis
        if (message.includes("')'")) {
            return 'Syntax error: possibly missing closing parenthesis )';
        }

        // Check for missing opening parenthesis
        if (message.includes("'('")) {
            return 'Syntax error: possibly missing opening parenthesis (';
        }

        // Check for missing closing bracket
        if (message.includes("']'")) {
            return 'Syntax error: possibly missing closing bracket ]';
        }

        // Check for missing opening bracket
        if (message.includes("'['")) {
            return 'Syntax error: possibly missing opening bracket [';
        }

        // Check for missing comma (common in lists)
        if (message.includes("','")) {
            return 'Syntax error: possibly missing comma ,';
        }

        // Generic simplification for other cases
        return 'Syntax error: unexpected token (check for missing punctuation)';
    }
}
