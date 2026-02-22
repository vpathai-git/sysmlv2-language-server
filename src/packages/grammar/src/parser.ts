/**
 * Standalone parser API for SysML v2
 * Use this for parsing without LSP dependencies
 */

import { createDefaultCoreModule, createDefaultSharedCoreModule, EmptyFileSystem, URI } from 'langium';
import { inject } from 'langium';
import { SysMLGeneratedModule, SysMLGeneratedSharedModule } from './generated/module.js';
import type { LangiumDocument } from 'langium';
import type { Namespace } from './generated/ast.js';

export interface ParseResult {
  /** The parsed AST */
  ast: Namespace;
  /** Parse errors (syntax errors) */
  parserErrors: ParseError[];
  /** Lexer errors (tokenization errors) */
  lexerErrors: ParseError[];
  /** Whether parsing succeeded */
  success: boolean;
}

export interface ParseError {
  message: string;
  line: number;
  column: number;
  offset: number;
  length: number;
}

/**
 * Create minimal SysML services for parsing only (no LSP)
 */
function createParsingServices() {
  const shared = inject(
    createDefaultSharedCoreModule(EmptyFileSystem),
    SysMLGeneratedSharedModule
  );

  const sysml = inject(
    createDefaultCoreModule({ shared }),
    SysMLGeneratedModule
  );

  shared.ServiceRegistry.register(sysml);
  return { shared, sysml };
}

// Singleton instance for parsing
let services: ReturnType<typeof createParsingServices> | undefined;

/**
 * Parse SysML source code
 *
 * @param source - SysML source code to parse
 * @param uri - Optional URI for the document (default: 'memory://model.sysml')
 * @returns ParseResult with AST and any errors
 *
 * @example
 * ```typescript
 * import { parseSysML } from '@sysml/grammar';
 *
 * const result = parseSysML(`
 *   package MySystem {
 *     part vehicle : Vehicle;
 *   }
 * `);
 *
 * if (result.success) {
 *   console.log(result.ast);
 * } else {
 *   console.error(result.parserErrors);
 * }
 * ```
 */
export function parseSysML(source: string, uri: string = 'memory://model.sysml'): ParseResult {
  // Create services lazily (singleton pattern)
  if (!services) {
    services = createParsingServices();
  }

  // Create document from source
  const document = services.shared.workspace.LangiumDocumentFactory.fromString(
    source,
    URI.parse(uri)
  ) as LangiumDocument<Namespace>;

  // Parse (synchronous)
  const parseResult = document.parseResult;

  return {
    ast: parseResult.value,
    parserErrors: parseResult.parserErrors.map(e => ({
      message: e.message,
      line: e.token.startLine ?? 0,
      column: e.token.startColumn ?? 0,
      offset: (e.token as any).startOffset ?? 0,
      length: (e.token.image?.length ?? e.token.tokenType.name.length)
    })),
    lexerErrors: parseResult.lexerErrors.map(e => ({
      message: e.message,
      line: e.line ?? 0,
      column: e.column ?? 0,
      offset: e.offset,
      length: e.length
    })),
    success: parseResult.parserErrors.length === 0 && parseResult.lexerErrors.length === 0
  };
}

/**
 * Dispose parser services (cleanup)
 * Call this when you're done parsing to free resources
 */
export function disposeParser(): void {
  services = undefined;
}
