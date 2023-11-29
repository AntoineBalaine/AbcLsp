import { Diagnostic } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { AbcErrorReporter } from "../Parser/ErrorReporter";
import { File_structure } from "../Parser/Expr";
import { Parser } from "../Parser/Parser";
import { Scanner } from "../Parser/Scanner";
import { TokensVisitor } from "../Parser/Visitors/SemanticTokens";
import { Token } from "../Parser/token";
import { mapAbcErrorsToDiagnostics } from "./server_helpers";

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
    this.diagnostics = mapAbcErrorsToDiagnostics(abcErrorReporter.getErrors());

    if (!this.AST) {
      return;
    }

    const analyzer = new TokensVisitor();
    analyzer.analyze(this.AST);
    this.tokens = analyzer.tokens;

    return tokens;
  }
}
