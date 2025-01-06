import { AbcErrorReporter, File_structure, Parser, Scanner, Token, TokensVisitor } from "abc-parser";
import { Diagnostic } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { mapAbcErrorsToDiagnostics, mapAbcWarningsToDiagnostics } from "./server_helpers";
import { ABCContext } from "abc-parser/src/parsers/Context";

/**
 * AbcDocument stores an Abc `TextDocument`'s diagnostics, tokens, and AST.
 *
 * Method `analyze()` returns an array of semantic tokens, or `void` in case of failure.
 */
export class AbcDocument {
  public diagnostics: Diagnostic[] = [];
  public tokens: Token[] = [];
  public AST: File_structure | null = null;
  public ctx = new ABCContext();
  constructor(public document: TextDocument) {}
  /**
   * Return an array of tokens, or void in case of failure.
   * `analyze()` parses the document,
   * stores the AST,
   * stores any diagnostics,
   * and stores the semantic tokens used for highlighting.
   *
   * @returns an array of semantic tokens or void.
   */
  analyze() {
    const source = String.raw`${this.document.getText()}`;

    this.diagnostics = [];
    this.tokens = [];

    const tokens = new Scanner(source, this.ctx).scanTokens();
    const parser = new Parser(tokens, this.ctx);
    this.AST = parser.parse();
    let errs = mapAbcErrorsToDiagnostics(this.ctx.errorReporter.getErrors());
    let warnings = mapAbcWarningsToDiagnostics(this.ctx.errorReporter.getWarnings());
    this.diagnostics = errs.concat(warnings);

    if (!this.AST) {
      return;
    }

    const analyzer = new TokensVisitor(this.ctx);
    analyzer.analyze(this.AST);
    this.tokens = analyzer.tokens;

    return tokens;
  }
}
