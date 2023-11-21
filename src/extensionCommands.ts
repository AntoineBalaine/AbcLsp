import { ExtensionContext, Selection, TextEdit, commands, window } from "vscode";
import { LanguageClient } from "vscode-languageclient/node";

export type AbcTransformParams = {
  selection: Selection;
  uri: string;
};

export function registerCommands(context: ExtensionContext, client: LanguageClient) {
  const disposable = commands.registerCommand("abc.divideRhythm", async () => {
    const editor = window.activeTextEditor;
    if (editor) {
      // Get the selection range
      const selection = editor.selection;

      // Include the selection information in the parameters when triggering the command
      const params: AbcTransformParams = { selection, uri: editor.document.uri.toString() };
      // Send a custom request to the language server with the selection information
      const onResponse = (res: [TextEdit]) => { //apply text edit to the doc
        editor.edit((editBuilder) => {
          editBuilder.replace(selection, res[0].newText);
        });
      };
      const res = await client.sendRequest<[TextEdit]>("divideRhythm", params);
      onResponse(res);
    }
  });
  context.subscriptions.push(disposable);
}