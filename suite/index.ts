// import * as path from "path";
// import * as Mocha from "mocha";
// import * as glob from "glob";

// export function run(): Promise<void> {
//   const mocha = new Mocha({
//     ui: "tdd",
//     color: true,
//   });

//   const testsRoot = path.resolve(__dirname, "..");

//   return new Promise((resolve, reject) => {
//     glob("**/**.test.js", { cwd: testsRoot }, (err, files) => {
//       if (err) {
//         return reject(err);
//       }

//       files.forEach((file) => mocha.addFile(path.resolve(testsRoot, file)));

//       try {
//         mocha.run((failures) => {
//           if (failures > 0) {
//             reject(new Error(`${failures} tests failed.`));
//           } else {
//             resolve();
//           }
//         });
//       } catch (err) {
//         reject(err);
//       }
//     });
//   });
// }
