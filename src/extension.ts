// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import { parseStringPromise } from "xml2js"; 
import { Csproj, ItemGroup, ProjectReference } from "./types";

async function parseCsproj(filePath: string) {
  const xml = fs.readFileSync(filePath, "utf8");
  const json = await parseStringPromise(xml);
  return json;
}

async function findDependencies(rootPath: string) {
  const csprojFiles = findCsprojFiles(rootPath);
  const dependencies = [];

  for (const file of csprojFiles) {
    const json = await parseCsproj(file);
    const projectReferences = json.Project.ItemGroup.flatMap(
      (group: ItemGroup) => group.ProjectReference || []
    );
    dependencies.push({
      file,
      projectReferences: projectReferences.map(
        (ref: ProjectReference) => ref.$.Include
      ),
    });
  }

  return dependencies;
}

function findCsprojFiles(dir: string): string[] {
  const files = fs.readdirSync(dir); 
    let csprojFiles: string[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      csprojFiles = csprojFiles.concat(findCsprojFiles(fullPath));
    } else if (file.endsWith(".csproj")) {
      csprojFiles.push(fullPath);
    }
  }

  return csprojFiles;
}

class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly filePath: string
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
  }
}

class DependencyProvider implements vscode.TreeDataProvider<Dependency> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    Dependency | undefined | null | void
  > = new vscode.EventEmitter<Dependency | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    Dependency | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private dependencies: Dependency[] = [];

  constructor(private rootPath: string) {
    this.dependencies = [];
    this.loadDependencies();
  }

  async loadDependencies() {
    const deps = await findDependencies(this.rootPath);
    this.dependencies = deps.map(
      (dep) =>
        new Dependency(
          dep.file,
          vscode.TreeItemCollapsibleState.Collapsed,
          dep.file
        )
    );
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Dependency): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: Dependency): Promise<Dependency[]> {
    if (!element) {
      return this.dependencies;
    }

    const dep = await parseCsproj(element.filePath);
    const projectReferences = dep.Project.ItemGroup.flatMap(
      (group: ItemGroup) => group.ProjectReference || []
    );
    return projectReferences.map(
      (ref:ProjectReference) =>
        new Dependency(
          ref.$.Include,
          vscode.TreeItemCollapsibleState.None,
          ref.$.Include
        )
    );
  }
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const rootPath = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : "";
  const dependencyProvider = new DependencyProvider(rootPath);

  vscode.window.createTreeView("dependencyView", {
    treeDataProvider: dependencyProvider,
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.refreshDependencies", () =>
      dependencyProvider.loadDependencies()
    )
  );

}

// This method is called when your extension is deactivated
export function deactivate() {}
