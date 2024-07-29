"use strict";
import * as vscode from "vscode";
import { DependencyProvider } from "./providers/dependencyProvider";
import { registerRefreshCommand } from "./commands/refreshDependencies"; 
import { logDebugMessage } from "./utils/utils";
import { printGraphToPdf, saveGraphToHtml, showGraph } from "./commands/showGraph";

export function activate(context: vscode.ExtensionContext) {
  logDebugMessage("Activating extension...");
  const rootPath = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : "";
  const dependencyProvider = new DependencyProvider(rootPath);

  vscode.window.createTreeView("dependencyView", {
    treeDataProvider: dependencyProvider,
  });

  registerRefreshCommand(context, dependencyProvider);

  context.subscriptions.push(
    vscode.commands.registerCommand("dv.showGraph", () => {
      showGraph(dependencyProvider.dependencies);
    })
  );

vscode.commands.registerCommand("dv.saveDependencyGraph", async () => {
  const folderUri = await vscode.window.showOpenDialog({
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false,
  });

  if (folderUri && folderUri[0]) {
    saveGraphToHtml(dependencyProvider.dependencies, folderUri[0].fsPath);
  } else {
    vscode.window.showErrorMessage("No folder selected");
  }
});

vscode.commands.registerCommand("dv.printDependencyGraph", async () => {
  const folderUri = await vscode.window.showOpenDialog({
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false,
  });

  if (folderUri && folderUri[0]) {
    await printGraphToPdf(dependencyProvider.dependencies, folderUri[0].fsPath);
  } else {
    vscode.window.showErrorMessage("No folder selected");
  }
});


}

export function deactivate() {
  logDebugMessage("Deactivatin");
}

 
 
