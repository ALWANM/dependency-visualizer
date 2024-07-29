// import * as vscode from "vscode";
// import * as path from "path";
// import * as fs from "fs";
// import { logDebugMessage, findDependencies } from "../utils/utils";
// import { DependencyData, ProjectReference } from "../types";
// import * as puppeteer from "puppeteer";

// export function registerShowGraphCommand(context: vscode.ExtensionContext) {
//   context.subscriptions.push(
//     vscode.commands.registerCommand("dv.showGraph", async () => {
//       logDebugMessage("Running command dv.showGraph");
//       const rootPath = vscode.workspace.workspaceFolders
//         ? vscode.workspace.workspaceFolders[0].uri.fsPath
//         : "";
//       showGraph(context, rootPath);
//     })
//   );
// }

// async function showGraph(context: vscode.ExtensionContext, rootPath: string) {
//   logDebugMessage("Creating webview panel for Dependency Graph");

//   const panel = vscode.window.createWebviewPanel(
//     "dependencyGraph",
//     "Dependency Graph",
//     vscode.ViewColumn.One,
//     {
//       enableScripts: true, // Allow scripts in the webview
//     }
//   );

//   logDebugMessage(`Finding dependencies in root path: ${rootPath}`);
//   const dependencies = await findDependencies(rootPath);

//   logDebugMessage(`Found ${dependencies.length} dependencies`);
//   const graphData = dependencies.map((dep) => ({
//     file: path.basename(dep.file),
//     references: dep.references.map((ref: string) => path.basename(ref)),
//   }));

//   logDebugMessage(`Graph data generated with ${graphData.length} entries`);
//   const htmlContent = getWebviewContent(graphData);

//   panel.webview.html = htmlContent;

//   // Save HTML content to a file
//   const htmlFilePath = path.join(rootPath, "dependencyGraph.html");
//   fs.writeFileSync(htmlFilePath, htmlContent, "utf8");
//   logDebugMessage(`HTML content saved to ${htmlFilePath}`);

//   // Convert the HTML file to PDF
//   const pdfFilePath = path.join(rootPath, "dependencyGraph.pdf");
//   await convertHtmlToPdf(htmlFilePath, pdfFilePath);

//   // Post message to update the graph in the webview
//   // panel.webview.postMessage({
//   //   command: "updateGraph",
//   //   graph: generateMermaidGraph(graphData),
//   // });
// }

// function getWebviewContent(graphData: DependencyData[]): string {
//   logDebugMessage("Generating Mermaid graph");
//   const mermaidGraph = generateMermaidGraph(graphData);

//   logDebugMessage("Reading HTML content from file");
//   const htmlFilePath = path.join(
//     __dirname,    
//     "html",
//     "dependencyGraph.html"
//   );
//   let htmlContent;
//   try {
//     htmlContent = fs.readFileSync(htmlFilePath, "utf8");
//   } catch (error) {
//     logDebugMessage(`Error reading HTML file: ${error}`);
//     throw error;
//   }
//   logDebugMessage("Replacing placeholder with Mermaid graph data");
//   htmlContent = htmlContent.replace("{{graphData}}", mermaidGraph);

//   return htmlContent;
// }

// function generateMermaidGraph(graphData: DependencyData[]): string {
//   logDebugMessage("Constructing Mermaid graph");
//   let graph = "classDiagram\n";

//   graphData.forEach((dep: DependencyData) => {
//     const fileNodeId = dep.file.replace(/[^a-zA-Z0-9]/g, "_");
//     graph += `class ${fileNodeId} {\n  ${dep.file}\n}\n`;
//     dep.references.forEach((ref: string) => {
//       const refNodeId = ref.replace(/[^a-zA-Z0-9]/g, "_");
//       graph += `class ${refNodeId} {\n  ${ref}\n}\n`;
//       graph += `${fileNodeId} --> ${refNodeId}\n`;
//     });
//   });

//   logDebugMessage("Mermaid graph constructed");
//   return graph;
// }

// async function convertHtmlToPdf(htmlFilePath: string, pdfFilePath: string) {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.goto(`file://${htmlFilePath}`, { waitUntil: "networkidle0" });
//   await page.pdf({ path: pdfFilePath, format: "A4" });
//   await browser.close();
//   logDebugMessage(`PDF generated at ${pdfFilePath}`);
// }


import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as puppeteer from "puppeteer";
import { logDebugMessage, findDependencies } from "../utils/utils";
import { DependencyData, ProjectReference } from "../types";

export function registerShowGraphCommand(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("dv.showGraph", async () => {
      logDebugMessage("Running command dv.showGraph");
      const rootPath = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : "";
      showGraph(context, rootPath);
    })
  );
}

async function showGraph(context: vscode.ExtensionContext, rootPath: string) {
  logDebugMessage("Creating webview panel for Dependency Graph");

  const panel = vscode.window.createWebviewPanel(
    "dependencyGraph",
    "Dependency Graph",
    vscode.ViewColumn.One,
    {
      enableScripts: true, // Allow scripts in the webview
    }
  );

  logDebugMessage(`Finding dependencies in root path: ${rootPath}`);
  const dependencies = await findDependencies(rootPath);

  logDebugMessage(`Found ${dependencies.length} dependencies`);
  const graphData = dependencies.map((dep) => ({
    file: path.basename(dep.file),
    references: dep.references.map((ref: string) => path.basename(ref)),
  }));

  logDebugMessage(`Graph data generated with ${graphData.length} entries`);
  const htmlContent = getWebviewContent(graphData);

  panel.webview.html = htmlContent;

  // Save HTML content to a file
  const htmlFilePath = path.join(rootPath, "dependencyGraph.html");
  fs.writeFileSync(htmlFilePath, htmlContent, "utf8");
  logDebugMessage(`HTML content saved to ${htmlFilePath}`);

  // Convert the HTML file to PDF
  const pdfFilePath = path.join(rootPath, "dependencyGraph.pdf");
  await convertHtmlToPdf(htmlFilePath, pdfFilePath);

  // Post message to update the graph in the webview
  panel.webview.postMessage({
    command: "updateGraph",
    graph: generateMermaidGraph(graphData),
  });
}

function getWebviewContent(graphData: DependencyData[]): string {
  logDebugMessage("Generating Mermaid graph");
  const mermaidGraph = generateMermaidGraph(graphData);

  logDebugMessage("Reading HTML content from file");
  const htmlFilePath = path.join(__dirname, "html", "dependencyGraph.html");
  let htmlContent;
  try {
    htmlContent = fs.readFileSync(htmlFilePath, "utf8");
  } catch (error) {
    logDebugMessage(`Error reading HTML file: ${error}`);
    throw error;
  }
  logDebugMessage("Replacing placeholder with Mermaid graph data");
  htmlContent = htmlContent.replace("{{graphData}}", mermaidGraph);

  return htmlContent;
}

function generateMermaidGraph(graphData: DependencyData[]): string {
  logDebugMessage("Constructing Mermaid graph");
  let graph = "classDiagram\n";

  graphData.forEach((dep: DependencyData) => {
    const fileNodeId = dep.file.replace(/[^a-zA-Z0-9]/g, "_");
    graph += `class ${fileNodeId} {\n  ${dep.file}\n}\n`;
    dep.references.forEach((ref: string) => {
      const refNodeId = ref.replace(/[^a-zA-Z0-9]/g, "_");
      graph += `class ${refNodeId} {\n  ${ref}\n}\n`;
      graph += `${fileNodeId} --> ${refNodeId}\n`;
    });
  });

  logDebugMessage("Mermaid graph constructed");
  return graph;
}

async function convertHtmlToPdf(htmlFilePath: string, pdfFilePath: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`file://${htmlFilePath}`, { waitUntil: "networkidle0" });
  await page.pdf({ path: pdfFilePath, format: "A4" });
  await browser.close();
  logDebugMessage(`PDF generated at ${pdfFilePath}`);
}
