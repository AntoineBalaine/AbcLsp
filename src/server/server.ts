/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  TextDocumentSyncKind,
  TextDocuments,
  createConnection,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { AbcTransformParams } from "../extensionCommands";
import { AbcLspServer } from "./AbcLspServer";
import { vscode_standardTokenScopes } from "./server_helpers";

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

const abcServer = new AbcLspServer(documents, (type, params) => {
  switch (type) {
    case "diagnostics":
      connection.sendDiagnostics(params);
      break;
    default:
      break;
  }
});

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;
  const hasSemanticTokensCapability =
    !!capabilities.textDocument?.semanticTokens?.requests?.full;
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      definitionProvider: true,
      referencesProvider: true,
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
  console.log("hasFormattingCapability", hasFormattingCapability);

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

documents.listen(connection);
connection.listen();
