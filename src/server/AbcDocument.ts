import { AbcErrorReporter, File_structure, Parser, Scanner, Token, TokensVisitor } from "abc-parser";
import { Diagnostic } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { mapAbcErrorsToDiagnostics, mapAbcWarningsToDiagnostics } from "./server_helpers";

export class AbcDocument {
  public diagnostics: Diagnostic[] = [];
  public tokens: Token[] = [];
  public AST: File_structure | null = null;
  constructor(public document: TextDocument) { }
  analyze() {
    const source = String.raw`${this.document.getText()}`;

    this.diagnostics = [];
    this.tokens = [];

    const abcErrorReporter = new AbcErrorReporter();
    const tokens = new Scanner(source, abcErrorReporter).scanTokens();
    const parser = new Parser(tokens, source, abcErrorReporter);
    this.AST = parser.parse();
    let errs = mapAbcErrorsToDiagnostics(abcErrorReporter.getErrors());
    let warnings = mapAbcWarningsToDiagnostics(abcErrorReporter.getWarnings());
    this.diagnostics = errs.concat(warnings);

    if (!this.AST) {
      return;
    }

    const analyzer = new TokensVisitor();
    analyzer.analyze(this.AST);
    this.tokens = analyzer.tokens;

    return tokens;
  }
}
