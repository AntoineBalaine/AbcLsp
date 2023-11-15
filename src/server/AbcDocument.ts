import { Diagnostic } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Parser } from "../Parser/Parser";
import Scanner from "../Parser/Scanner";
import { getError, setError } from "../Parser/error";
import Token from "../Parser/token";
import { TokensVisitor } from "./SemanticTokens";

export class AbcDocument {
  public diagnostics: Diagnostic[] = [];
  public hadError: boolean = false;
  /**TODO create SemanticToken analyzer */
  public tokens: Token[] = [];
  constructor(public document: TextDocument) {}
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
    const statements = parser.parse();
    if (!statements || getError()) {
      return;
    }
    if (statements && !this.hadError) {
      const analyzer = new TokensVisitor();
      analyzer.analyze(statements);
      this.tokens = analyzer.tokens;
    }
    return tokens;
  }
}
