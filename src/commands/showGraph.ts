import * as vscode from "vscode";
import {  Dependency} from "../providers/dependencyProvider";  

import * as fs from "fs";
import * as path from "path";
import * as puppeteer from "puppeteer";
import { logDebugMessage } from "../utils/utils";


export function showGraph(dependencies: Dependency[]) {
  const panel = vscode.window.createWebviewPanel(
    "dependencyGraph",
    "Dependency Graph",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  // Log each dependency's data
  dependencies.forEach((dependency) => {
    logDebugMessage(`Dependency:
      Label: ${dependency.label}
      File Path: ${dependency.filePath}
      Project References: ${dependency.projectReferences.join(", ")}`);
  }); 
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


function extractProjectName(filePath: string): string {
    let aaa = path.basename(filePath, path.extname(filePath));
  // Find the position of the last backslash in the filePath
  const lastBackslashIndex = aaa.lastIndexOf("\\");
  // Extract the substring from the character after the last backslash to the end of the string
    return aaa.substring(lastBackslashIndex + 1); 
}

function getWebviewContent(dependencies: Dependency[]): string {

      const colorMap: { [key: string]: string } = {};
      const generateColor = () =>
        "#" + Math.floor(Math.random() * 16777215).toString(16);

      dependencies.forEach((dep) => {
        dep.projectReferences.forEach((ref) => {
          const projectName = extractProjectName(ref);
          if (!colorMap[projectName]) {
            colorMap[projectName] = generateColor();
          }
        });
      });
    

    const nodes = dependencies.map((dep) => ({
      key: dep.filePath,
      text: `${dep.label}`,
      filePath: dep.filePath,
    }));
  
    const links = dependencies.flatMap((dep) =>
      dep.projectReferences.map((ref) => ({
        from: dep.filePath,
        to: ref,//extractProjectName(ref),
        color: colorMap[extractProjectName(ref)],
      }))
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dependency Graph</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gojs/2.1.52/go.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        #myDiagramDiv {
            width: 100%;
            height: 100vh;
            background-color: #f0f0f0;
        }
    </style>
</head>
<body>
    <div id="myDiagramDiv"></div>
    <script>
        function init() {
            var $ = go.GraphObject.make;

            var myDiagram =    $(go.Diagram, "myDiagramDiv",
          {
            layout: $(go.LayeredDigraphLayout, { direction: 180 }),
            initialContentAlignment: go.Spot.Center,
            "undoManager.isEnabled": true,
            "toolManager.hoverDelay": 200,  // Tooltip delay
            "animationManager.isEnabled": false // Disable animations for smoother zoom to fit
          });
            
            // Node template
            myDiagram.nodeTemplate = $(go.Node, "Auto",
                $(go.Shape, "RoundedRectangle", { strokeWidth: 1, stroke: "black", fill: "white" }, new go.Binding("fill", "color")),
                $(go.TextBlock, { margin: 8, editable: true }, new go.Binding("text", "text").makeTwoWay()),
                {
                    toolTip: $(go.Adornment, "Auto",
                        $(go.Shape, { fill: "#EFEFCC" }),
                        $(go.TextBlock, { margin: 4 },
                            new go.Binding("text", "filePath"))
                    )
                }
            );
 
            // Link template
            myDiagram.linkTemplate = $(go.Link,
            { routing: go.Link.AvoidsNodes, corner: 5, curve: go.Link.JumpOver },
                $(go.Shape, new go.Binding("stroke", "color")),
                $(go.Shape, { toArrow: "Standard", fill: null }, new go.Binding("stroke", "color"))
            );

            myDiagram.model = new go.GraphLinksModel(
                ${JSON.stringify(nodes)},
                ${JSON.stringify(links)}
            );
            
            // Zoom to fit
             myDiagram.zoomToFit();

             // Adjusts the diagram bounds and layout
             myDiagram.requestUpdate();
        }

        document.addEventListener('DOMContentLoaded', init);
    </script>
</body>
</html>`; 
}

