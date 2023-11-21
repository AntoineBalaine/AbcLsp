import { Diagnostic } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { File_structure } from "../Parser/Expr";
import { Parser } from "../Parser/Parser";
import { Scanner } from "../Parser/Scanner";
import { TokensVisitor } from "../Parser/Visitors/SemanticTokens";
import { getError, setError } from "../Parser/error";
import { Token } from "../Parser/token";

export class AbcDocument {
  public diagnostics: Diagnostic[] = [];
  public hadError: boolean = false;
  /**TODO create SemanticToken analyzer */
  public tokens: Token[] = [];
  public AST: File_structure | null = null;
  constructor(public document: TextDocument) { }
  analyze() {
    const source = this.document.getText();

    this.diagnostics = [];
    this.tokens = [];
    /**
     * TODO build reporter for diagnostics
     */

    this.hadError = false;
    setError(false);
    const tokens = new Scanner(source).scanTokens();
    const parser = new Parser(tokens, source);
    this.AST = parser.parse();
    if (!this.AST || getError()) {
      return;
    }
    if (this.AST && !this.hadError) {
      const analyzer = new TokensVisitor();
      analyzer.analyze(this.AST);
      this.tokens = analyzer.tokens;
    }
    return tokens;
  }
}
