import { Selection } from "vscode";
import {
  HandlerResult,
  Position,
  Range,
  SemanticTokens,
  SemanticTokensBuilder,
  TextDocuments,
  TextEdit,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { AbcFormatter } from "../Parser/Visitors/Formatter";
import { RhythmVisitor } from "../Parser/Visitors/RhythmTransform";
import { AbcDocument } from "./AbcDocument";
import { LspEventListener, mapTokenTypeToStandardScope } from "./server_helpers";

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
        Position.create(Number.MAX_VALUE, Number.MAX_VALUE)
      ),
      formatted
    );
    return [edit];
  }

  onRhythmTransform(uri: string, type: "*" | "/", range: Selection): HandlerResult<TextEdit[], void> {
    const abcDocument = this.abcDocuments.get(uri); // find doc in previously parsed docs
    if (!abcDocument || !abcDocument.tokens) {
      return [];
    }
    const visitor = new RhythmVisitor(abcDocument.AST!);
    visitor.transform(type, range);

    const edit = TextEdit.replace(
      range,
      visitor.getChanges()
    );
    return [edit];
  }
}


