import { AbcErrorReporter, File_structure, Parser, Scanner, Token, TokensVisitor } from "abc-parser";
import { Diagnostic } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { mapAbcErrorsToDiagnostics, mapAbcWarningsToDiagnostics } from "./server_helpers";

/**
 * AbcDocument stores an Abc `TextDocument`'s diagnostics, tokens, and AST.
 * 
 * Method `analyze()` returns an array of semantic tokens, or `void` in case of failure.
 */
export class AbcDocument {
  public diagnostics: Diagnostic[] = [];
  public tokens: Token[] = [];
  public AST: File_structure | null = null;
  constructor(public document: TextDocument) { }
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
