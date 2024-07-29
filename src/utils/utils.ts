import * as fs from "fs";
import * as path from "path";
import { parseStringPromise } from "xml2js";
import { DependencyData, ItemGroup, ProjectReference } from "../types";

export async function parseCsproj(filePath: string) {
  console.log(`Parsing csproj file: ${filePath}`);
  const xml = fs.readFileSync(filePath, "utf8");
  const json = await parseStringPromise(xml);
  return json;
}

export function logDebugMessage(message: string) {
  console.log(`[DEBUG] ${message}`);
}

export async function findDependencies(rootPath: string) {
  logDebugMessage(`Finding dependencies in root path: ${rootPath}`);
  const csprojFiles = findCsprojFiles(rootPath);
  const dependencies :DependencyData[] = [];

  for (const file of csprojFiles) {
    logDebugMessage(`Processing csproj file: ${file}`);
    const json = await parseCsproj(file);
    if (json.Project && json.Project.ItemGroup) {
      const projectReferences: ProjectReference[] =
        json.Project.ItemGroup.flatMap(
          (group: ItemGroup) => group.ProjectReference || []
        );
      dependencies.push({
        file,
        references: projectReferences.map(
          (ref: ProjectReference) => ref.$.Include
        ),
      });
    } else {
      logDebugMessage(`No ItemGroup found in ${file}`);
    }
  }
  logDebugMessage(`Found ${dependencies.length} dependencies.`);
  return dependencies;
}

function findCsprojFiles(dir: string): string[] {
  logDebugMessage(`Searching for csproj files in directory: ${dir}`);
  const files = fs.readdirSync(dir);
  let csprojFiles: string[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      csprojFiles = csprojFiles.concat(findCsprojFiles(fullPath));
    } else if (file.endsWith(".csproj")) {
      console.log(`Found csproj file: ${fullPath}`);
      csprojFiles.push(fullPath);
    }
  }

  return csprojFiles;
}
