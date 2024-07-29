import * as vscode from "vscode";
import {  Dependency} from "../providers/dependencyProvider";  

import * as fs from "fs";
import * as path from "path";
import * as puppeteer from "puppeteer";


export function showGraph(dependencies: Dependency[]) {
  const panel = vscode.window.createWebviewPanel(
    "dependencyGraph",
    "Dependency Graph",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  panel.webview.html = getWebviewContent(dependencies);
}



export function saveGraphToHtml(dependencies: Dependency[], directory: string) {
  const htmlContent = getWebviewContent(dependencies);
  const filePath = path.join(directory, "dependencyGraph.html");

  fs.writeFileSync(filePath, htmlContent, "utf8");
  vscode.window.showInformationMessage(`Graph saved to ${filePath}`);
}

export async function printGraphToPdf(
  dependencies: Dependency[],
  directory: string
) {
  const htmlContent = getWebviewContent(dependencies);
  const htmlFilePath = path.join(directory, "dependencyGraph.html");

  fs.writeFileSync(htmlFilePath, htmlContent, "utf8");

  const pdfFilePath = path.join(directory, "dependencyGraph.pdf");

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`file://${htmlFilePath}`, { waitUntil: "networkidle0" });
  await page.pdf({ path: pdfFilePath, format: "A4" });

  await browser.close();

  vscode.window.showInformationMessage(
    `Graph printed to PDF at ${pdfFilePath}`
  );
}



function getWebviewContent(dependencies: Dependency[]): string {
  const nodes = dependencies.map((dep) => ({
    key: dep.label,
    text: `${dep.label} `, //(${dep.filePath})
  }));
  const links = dependencies.flatMap((dep) =>
    dep.projectReferences.map((ref) => ({ from: dep.label, to: ref }))
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dependency Graph</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gojs/2.1.52/go.js"></script>
</head>
<body>
    <div id="myDiagramDiv" style="width:100%; height:600px; background-color: #DAE4E4;"></div>
    <script>
        function init() {
            var $ = go.GraphObject.make;

            var myDiagram =
              $(go.Diagram, "myDiagramDiv",
                {
                  "undoManager.isEnabled": true
                });

            myDiagram.nodeTemplate =
              $(go.Node, "Auto",
                $(go.Shape, "RoundedRectangle", { strokeWidth: 0, fill: "white" },
                  new go.Binding("fill", "color")),
                $(go.TextBlock,
                  { margin: 8, editable: true },
                  new go.Binding("text", "text").makeTwoWay())
              );

            myDiagram.linkTemplate =
              $(go.Link,
                { routing: go.Link.AvoidsNodes, corner: 5 },
                $(go.Shape),
                $(go.Shape, { toArrow: "Standard" })
              );

            myDiagram.model = new go.GraphLinksModel(
              ${JSON.stringify(nodes)},
              ${JSON.stringify(links)}
            );
        }

        document.addEventListener('DOMContentLoaded', init);
    </script>
</body>
</html>`;
}

