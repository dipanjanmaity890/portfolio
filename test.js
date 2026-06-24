const { JSDOM } = require("jsdom");
const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
dom.window.document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded fired");
});
dom.window.onerror = function(msg) {
  console.log("Global error: " + msg);
};
setTimeout(() => { console.log("Done waiting."); }, 2000);
