/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
  CompletionItem,
  CompletionItemKind,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  TextDocuments,
  createConnection,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { AbcTransformParams } from "../extensionCommands";
import { AbcLspServer } from "./AbcLspServer";
import { DECORATION_SYMBOLS } from "./completions";
import { vscode_standardTokenScopes } from "./server_helpers";

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

/**
 * Instantiate an AbcServer, which will store the documents and handle the requests.
 */
const abcServer = new AbcLspServer(documents, (type, params) => {
  switch (type) {
    case "diagnostics":
      connection.sendDiagnostics(params);
      break;
    default:
      break;
  }
});

/**
 * Check the capabilities of the client,
 * and return the capabilities of the server.
 * This is so the client knows what to ask from the server.
 */
connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;
  const hasSemanticTokensCapability =
    !!capabilities.textDocument?.semanticTokens?.requests?.full;
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      definitionProvider: true,
      referencesProvider: true,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ["!"],
      }
    },
  };
  result.capabilities.documentHighlightProvider = false;
  result.capabilities.renameProvider = {
    prepareProvider: false,
  };
  result.capabilities.documentSymbolProvider = false;
  /*   if (capabilities.textDocument?.documentHighlight) {
    result.capabilities.documentHighlightProvider = true;
  }

  if (hasRenameCapability) {
    result.capabilities.renameProvider = {
      prepareProvider: true,
    };
  }

  if (hasSymbolProviderCapability) {
    console.log(capabilities.textDocument?.semanticTokens);
    result.capabilities.documentSymbolProvider = true;
  } */

  if (hasSemanticTokensCapability) {
    result.capabilities.semanticTokensProvider = {
      legend: {
        tokenTypes: Object.keys(vscode_standardTokenScopes).filter((val) =>
          Number.isNaN(parseInt(val, 10))
        ),

        tokenModifiers: [],
      },
      range: false,
      full: true,
    };
  }

  const hasFormattingCapability =
    !!capabilities.textDocument?.formatting?.dynamicRegistration;

  if (hasFormattingCapability) {
    result.capabilities.documentFormattingProvider = true;
  }

  return result;
});

connection.onInitialized(() => { });

connection.languages.semanticTokens.on((params) => {
  return abcServer.onSemanticTokens(params.textDocument.uri);
});

connection.onDocumentFormatting((params) =>
  abcServer.onFormat(params.textDocument.uri)
);

connection.onRequest("divideRhythm", (params: AbcTransformParams) => {
  return abcServer.onRhythmTransform(params.uri, "/", params.selection);
});
connection.onRequest("multiplyRhythm", (params: AbcTransformParams) => {
  return abcServer.onRhythmTransform(params.uri, "*", params.selection);
});
connection.onCompletion(
  (textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    // The passed parameter contains the position of the text document in
    // which code complete got requested.
    const doc = abcServer.abcDocuments.get(textDocumentPosition.textDocument.uri);
    if (!doc) {
      return [];
    }
    const char = abcServer.findCharInDoc(textDocumentPosition.textDocument.uri, textDocumentPosition.position.character, textDocumentPosition.position.line);

    /**
     * If the char is not a completion trigger, ignore.
     */
    if (!char || char !== "!") {
      return [];
    }
    // TODO check that the char is in the body.
    return DECORATION_SYMBOLS.map((symbol, index) => {

      /**
       * TODO if documentation doesn't display, 
       * use the onCompletionResolve
       */
      return <CompletionItem>{
        data: index + 1,
        documentation: symbol.documentation,
        kind: CompletionItemKind.Text,
        insertText: symbol.label.replace(/[!]/g, ""),
        label: symbol.label,
        labelDetails: "decoration",
      };
    });
  }
);

connection.onCompletionResolve(
  (item: CompletionItem): CompletionItem => {
    return item;
  }
);

documents.listen(connection);
connection.listen();
