import { AbcError, TokenType, getTokenRange } from "abc-parser";
import { Diagnostic, PublishDiagnosticsParams } from "vscode-languageserver";

/**
 * TODO refactor these two functions. The map containing warnings and errors all together should be coming from the error reporter.
 */
/**
 * convert errors from an {@link AbcErrorReporter} to the server's {@link Diagnostic}s
 */
export function mapAbcErrorsToDiagnostics(abcErrors: Array<AbcError>): Array<Diagnostic> {
  return abcErrors.map((error): Diagnostic => {
    return {
      severity: 1,
      range: getTokenRange(error.token),
      message: error.message,
      source: "abc",
    };
  }
  );
}
/**
 * convert warnings from an {@link AbcErrorReporter} to the server's {@link Diagnostic}s
 */
export function mapAbcWarningsToDiagnostics(abcwarnings: Array<AbcError>): Array<Diagnostic> {
  return abcwarnings.map((warning): Diagnostic => {
    return {
      severity: 2,
      range: getTokenRange(warning.token),
      message: warning.message,
      source: "abc",
    };
  });
}

/**
 * Convert an {@link TokenType} from the parse's AST to a standard scope name used by vscode.
 * This is so that the client can display syntax highlighting.
 * 
 * Since ABC is a markdown format that uses music notation,
 * it's necessary to have this function to build correspondence 
 * between the music terms and the programming-language terms 
 * that are used in syntax highlighting.
 */
export function mapTokenTypeToStandardScope(type: number): number {
  switch (type) {
    case TokenType.BARLINE: //|
    case TokenType.BAR_COLON: // |:
    case TokenType.BAR_DBL: // ||
    case TokenType.BAR_DIGIT: // |1
    case TokenType.BAR_RIGHTBRKT: // |]
    case TokenType.COLON_BAR: // :|
    case TokenType.COLON_BAR_DIGIT: // :|1
      return vscode_standardTokenScopes.string;
    case TokenType.COLON: // :
      return vscode_standardTokenScopes.string;
    case TokenType.APOSTROPHE: // octave
    case TokenType.COMMA: //,,,,,, octave
      return vscode_standardTokenScopes.string;
    case TokenType.COMMENT:
    case TokenType.STYLESHEET_DIRECTIVE: // %%
      return vscode_standardTokenScopes.comment;
    case TokenType.DOLLAR: //$
      return vscode_standardTokenScopes.string;
    case TokenType.DOT:
      return vscode_standardTokenScopes.decorator;
    case TokenType.NOTE_LETTER:
      return vscode_standardTokenScopes.variable;
    case TokenType.LETTER:
      return vscode_standardTokenScopes.string;
    case TokenType.AMPERSAND: // &
    case TokenType.LETTER_COLON: //A:
    case TokenType.PLUS_COLON: //+: - extending info line
    case TokenType.ANTISLASH_EOL:
    case TokenType.ESCAPED_CHAR:
      return vscode_standardTokenScopes.keyword;
    case TokenType.MINUS:
    case TokenType.FLAT: // ♭
    case TokenType.FLAT_DBL: // 𝄫
    case TokenType.SHARP: // ♯
    case TokenType.SHARP_DBL: // : //-
    case TokenType.NATURAL: // ♮
      return vscode_standardTokenScopes.decorator;
    case TokenType.NUMBER:
      return vscode_standardTokenScopes.number;
    case TokenType.PLUS: //+
      return vscode_standardTokenScopes.string;
    case TokenType.RESERVED_CHAR:
      return vscode_standardTokenScopes.string;
    case TokenType.LEFTBRKT_BAR: // [|
    case TokenType.LEFTBRKT_NUMBER: // [number
    case TokenType.LEFTBRKT: // [
    case TokenType.LEFT_BRACE: // {
    case TokenType.RIGHT_BRACE: // }
    case TokenType.RIGHT_BRKT: // ]
    case TokenType.RIGHT_PAREN: // )
      return vscode_standardTokenScopes.string;
    case TokenType.COLON_DBL: // (1 rhythm
    case TokenType.COLON_NUMBER: // (1 rhythm
    case TokenType.LEFTPAREN_NUMBER: // (1 rhythm
      return vscode_standardTokenScopes.number;
    case TokenType.GREATER: //>>>>> rhythm
    case TokenType.LESS: // <<<<< rhythm
    case TokenType.SLASH: // ////
      return vscode_standardTokenScopes.number; // rhythm
    case TokenType.STRING: // any un-categorizable text
      return vscode_standardTokenScopes.string;
    case TokenType.SYMBOL: // ![a-zA-Z]!
      return vscode_standardTokenScopes.regexp;
    case TokenType.TILDE: // ~
      return vscode_standardTokenScopes.string;
    default:
      return -1;
  }
}

export type LspEventListener = (
  type: "diagnostics",
  params: PublishDiagnosticsParams
) => void;

/**
 * These are the standard scope names that are used by vscode to display syntax highlighting.
 */
export enum vscode_standardTokenScopes {
  class,
  comment,
  decorator,
  enum,
  enumMember,
  event,
  function,
  interface,
  keyword,
  label,
  macro,
  method,
  namespace,
  number,
  operator,
  parameter,
  property,
  regexp,
  string,
  struct,
  type,
  typeParameter,
  variable
}


/*
 *
USED scopes: 
comment
decorator;
keyword;
number;
regexp;
string;
variable
*/
