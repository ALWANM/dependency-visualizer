
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { logDebugMessage, parseCsproj } from "../utils/utils";
import { IDependency, ItemGroup, PackageReference, ProjectReference } from "../types";

export class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly filePath: string,
    public readonly projectReferences: string[] = []
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
  }
}

export class DependencyProvider implements vscode.TreeDataProvider<Dependency> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    Dependency | undefined | null | void
  > = new vscode.EventEmitter<Dependency | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    Dependency | undefined | null | void
  > = this._onDidChangeTreeData.event;

  public dependencies: Dependency[] = [];

  constructor(private rootPath: string) {
    logDebugMessage(
      `Initializing DependencyProvider with root path: ${rootPath}`
    );
    this.dependencies = [];
    this.loadDependencies();
  }

  async loadDependencies() {
    logDebugMessage(`Loading dependencies...`);
    const deps = await findDependencies(this.rootPath);
    this.dependencies = deps.map(
      (dep) =>
        new Dependency(
          path.basename(dep.file, ".csproj"),
          vscode.TreeItemCollapsibleState.Collapsed,
          dep.file,
          dep.projectReferences
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
    const itemGroups: ItemGroup[] = dep.Project.ItemGroup || [];
    const projectReferences: ProjectReference[] = itemGroups.flatMap(
      (group: ItemGroup) => group.ProjectReference || []
    );
    const packageReferences: PackageReference[] = itemGroups.flatMap(
      (group: ItemGroup) => group.PackageReference || []
    );

    const dependencies = [
      ...projectReferences.map(
        (ref: ProjectReference) =>
          new Dependency(
            replaceParentFolderPlaceholder(
              ref.$.Include,
              element.filePath,
              this.rootPath
            ),
            vscode.TreeItemCollapsibleState.None,
            ref.$.Include
          )
      ),
      ...packageReferences.map(
        (ref: PackageReference) =>
          new Dependency(
            ref.$.Include,
            vscode.TreeItemCollapsibleState.None,
            ref.$.Include
          )
      ),
    ];

    return dependencies;
  }
}

async function findDependencies(rootPath: string) {
  logDebugMessage(`Finding dependencies in root path: ${rootPath}`);
  const csprojFiles = findCsprojFiles(rootPath);
  const dependencies: IDependency[] = [];

  // Initial pass to gather basic dependency information
  for (const file of csprojFiles) {
    logDebugMessage(`Processing csproj file: ${file}`);
    const json = await parseCsproj(file);
    const itemGroups: ItemGroup[] = json.Project.ItemGroup || [];
    const projectReferences: ProjectReference[] = itemGroups.flatMap(
      (group: ItemGroup) => group.ProjectReference || []
    );
    const packageReferences: PackageReference[] = itemGroups.flatMap(
      (group: ItemGroup) => group.PackageReference || []
    );

    dependencies.push({
      file: file,
      projectReferences: projectReferences.map(ref => ref.$.Include),
      packageReferences: packageReferences.map(ref => ref.$.Include),
    });
  }

  // Resolve projectReferences to actual file paths
  const resolvedDependencies = dependencies.map(dependency => {
    const resolvedProjectReferences = dependency.projectReferences.map(ref => {
      const cleanedRef = replaceParentFolderPlaceholder(ref, dependency.file, rootPath);
      const matchingDependency = dependencies.find(d => d.file.includes(path.basename(cleanedRef)));
      return matchingDependency ? matchingDependency.file : cleanedRef;
    });

    return {
      file: dependency.file,
      projectReferences: resolvedProjectReferences,
      packageReferences: dependency.packageReferences,
    };
  });

  logDebugMessage(`Found ${resolvedDependencies.length} dependencies.`);
  return resolvedDependencies;
}

// async function findDependencies(rootPath: string) {
//   logDebugMessage(`Finding dependencies in root path: ${rootPath}`);
//   const csprojFiles = findCsprojFiles(rootPath);
//   const dependencies = [];

//   for (const file of csprojFiles) {
//     logDebugMessage(`Processing csproj file: ${file}`);
//     const json = await parseCsproj(file);
//     const itemGroups: ItemGroup[] = json.Project.ItemGroup || [];
//     const projectReferences: ProjectReference[] = itemGroups.flatMap(
//       (group: ItemGroup) => group.ProjectReference || []
//     );
//     const packageReferences: PackageReference[] = itemGroups.flatMap(
//       (group: ItemGroup) => group.PackageReference || []
//     );

//     const allReferences = [...projectReferences, ...packageReferences];

//     dependencies.push({
//       file:  file,
//       projectReferences: allReferences.map((ref) =>  
//         replaceParentFolderPlaceholder(ref.$.Include, file, rootPath)        
//       ),
//     });
//   }

//   logDebugMessage(`Found ${dependencies.length} dependencies.`);
//   return dependencies;
// }

function findCsprojFiles(dir: string): string[] {
  // logDebugMessage(`Searching for csproj files in directory: ${dir}`);
  const files = fs.readdirSync(dir);
  let csprojFiles: string[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      csprojFiles = csprojFiles.concat(findCsprojFiles(fullPath));
    } else if (file.endsWith(".csproj")) {
      logDebugMessage(`Found csproj file: ${fullPath}`);
      csprojFiles.push(fullPath);
    }
  }

  return csprojFiles;
}

function removeRootPath(filePath: string, rootPath: string): string {
  if (filePath.startsWith(rootPath)) {
    logDebugMessage(`Before filepath  :  ${filePath} .`);
    let ssss = filePath.substring(rootPath.length + 1);
    logDebugMessage(`After filepath  :  ${ssss} .`);
    return ssss;
  }
  return filePath;
}

function replaceParentFolderPlaceholder(
  refPath: string,
  parentPath: string,
  rootPath: string
): string {
  logDebugMessage(`Before :  ${refPath}  ${parentPath} ${rootPath}.`); 
  // Replace all occurrences of ..\ with an empty string
  let output = refPath.replace(/\.{2}\\{1}/g, "");
  // Replace all occurrences of \ with /
  output = output.replace(/\\{1}/g, "/"); 
  logDebugMessage(`After :  ${output} .`);
  return output;
}
 
