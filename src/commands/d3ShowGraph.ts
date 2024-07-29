import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as puppeteer from "puppeteer"; // Import puppeteer for PDF generation
import { logDebugMessage, findDependencies } from "../utils/utils";
import { DependencyData } from "../types";

export function registerShowGraphCommand(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("dv.showGraph", async () => {
      logDebugMessage("Running command dv.showGraph");
      const rootPath = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : "";
      await showGraph(context, rootPath);
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

  const graphData: {
    nodes: { id: string; parent?: string }[];
    links: { source: string; target: string }[];
  } = {
    nodes: [],
    links: [],
  };

  dependencies.forEach((dep) => {
    const depNode = { id: path.basename(dep.file) };
    if (!graphData.nodes.some((node) => node.id === depNode.id)) {
      graphData.nodes.push(depNode);
    }
    dep.references.forEach((ref) => {
      const refNode = { id: path.basename(ref) };
      if (!graphData.nodes.some((node) => node.id === refNode.id)) {
        graphData.nodes.push(refNode);
      }
      graphData.links.push({ source: depNode.id, target: refNode.id });
    });
  });

  // Convert graphData to a JSON string and escape it
  const graphDataString = JSON.stringify(graphData)
    .replace(/\\/g, "\\\\") // Escape backslashes
    .replace(/"/g, '\\"'); // Escape double quotes

  const htmlContent = getWebviewContent(graphDataString);

  // Escape backslashes in file paths
  const escapedRootPath = escapeBackslashes(rootPath);

  // Save HTML file
  const htmlFilePath = path.join(escapedRootPath, "dependencyGraph.html");
  fs.writeFileSync(htmlFilePath, htmlContent);
  logDebugMessage(`HTML file saved to ${htmlFilePath}`);

  // Convert HTML to PDF
  await convertHtmlToPdf(htmlFilePath, escapedRootPath);

  panel.webview.html = htmlContent;
}

function getWebviewContent(graphDataString: string): string {
  const htmlFilePath = path.join(__dirname, "html", "dependencyGraph.html");
  let htmlContent = fs.readFileSync(htmlFilePath, "utf8");
  logDebugMessage(graphDataString);
  // Replace placeholder with dynamic data
  htmlContent = htmlContent.replace("{{graphData}}", graphDataString);

  return htmlContent;
}

async function convertHtmlToPdf(
  htmlFilePath: string,
  rootPath: string
): Promise<void> {
  const pdfFilePath = path.join(rootPath, "dependencyGraph.pdf");

  // Launch Puppeteer to convert HTML to PDF
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`file://${htmlFilePath}`, { waitUntil: "networkidle0" });
  await page.pdf({ path: pdfFilePath, format: "A4" });

  await browser.close();
  logDebugMessage(`PDF file saved to ${pdfFilePath}`);
}

// Function to escape backslashes in file paths
function escapeBackslashes(str: string): string {
  return str.replace(/\\/g, "-");
}
