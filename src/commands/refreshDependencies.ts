import * as vscode from "vscode";
import { DependencyProvider } from "../providers/dependencyProvider";

export function registerRefreshCommand(
  context: vscode.ExtensionContext,
  dependencyProvider: DependencyProvider
) {
  context.subscriptions.push(
    vscode.commands.registerCommand("dv.rd", () => {
      console.log("Running command dv.rd");
      vscode.window.showInformationMessage("Hello World from ma!");
      dependencyProvider.loadDependencies();
    })
  );
}
