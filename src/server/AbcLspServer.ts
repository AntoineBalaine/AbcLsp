import {
  HandlerResult,
  Position,
  PublishDiagnosticsParams,
  Range,
  SemanticTokens,
  SemanticTokensBuilder,
  TextDocuments,
  TextEdit,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { AbcFormatter } from "../Parser/Visitors/Formatter";
import { TokenType } from "../Parser/types";
import { AbcDocument } from "./AbcDocument";

type LspEventListener = (
  type: "diagnostics",
  params: PublishDiagnosticsParams
) => void;

export class AbcLspServer {
  abcDocuments: Map<string, AbcDocument> = new Map();
  constructor(
    private documents: TextDocuments<TextDocument>,
    private listener: LspEventListener
  ) {
    this.documents.onDidChangeContent((change) => {
      this.onDidChangeContent(change.document.uri);
    });

    this.documents.onDidClose((event) => {
      this.abcDocuments.delete(event.document.uri);
    });
  }
  onDidChangeContent(uri: string) {
    let abcDocument = this.abcDocuments.get(uri);
    if (!abcDocument) {
      const document = this.documents.get(uri);
      if (document) {
        abcDocument = new AbcDocument(document);
        this.abcDocuments.set(uri, abcDocument);
      }
    }

    if (abcDocument) {
      abcDocument.analyze();
      this.listener("diagnostics", {
        uri: uri,
        diagnostics: abcDocument.diagnostics,
      });
    }
  }
  onSemanticTokens(uri: string): HandlerResult<SemanticTokens, void> {
    const abcDocument = this.abcDocuments.get(uri); // find doc in previously parsed docs
    if (!abcDocument || !abcDocument.tokens) {
      return { data: [] };
    }

    const builder = new SemanticTokensBuilder();

    for (const token of abcDocument.tokens) {
      builder.push(
        token.line,
        token.position,
        token.lexeme.length,
        mapTokenTypeToStandardScope(token.type), // typeId TODO figure out the correct typings
        0
      );
    }

    return builder.build();
  }

  onFormat(uri: string): HandlerResult<TextEdit[], void> {
    const abcDocument = this.abcDocuments.get(uri); // find doc in previously parsed docs
    if (!abcDocument || !abcDocument.tokens) {
      return [];
    }

    const formatted = new AbcFormatter().format(abcDocument.AST!);
    const edit = TextEdit.replace(
      Range.create(
        Position.create(0, 0),
        Position.create(Number.MAX_VALUE, Number.MAX_VALUE) // TODO is this really reasonable?
      ),
      formatted
    );
    return [edit];
  }
}

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
  variable,
}

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
    case TokenType.COLON_DBL: // ::
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
    case TokenType.LETTER_COLON: //A:
    case TokenType.PLUS_COLON: //+: - extending info line
    case TokenType.ANTISLASH_EOL:
      return vscode_standardTokenScopes.keyword;
    case TokenType.MINUS: //-
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
    case TokenType.FLAT: // ♭
    case TokenType.FLAT_DBL: // 𝄫
    case TokenType.SHARP: // ♯
    case TokenType.SHARP_DBL: // 𝄪
      return vscode_standardTokenScopes.string;
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
