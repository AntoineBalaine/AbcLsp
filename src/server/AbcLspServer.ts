import {
  HandlerResult,
  PublishDiagnosticsParams,
  SemanticTokens,
  SemanticTokensBuilder,
  TextDocuments,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
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
        token.type, // typeId TODO figure out the correct typings
        0
      );
    }

    return builder.build();
  }
}
