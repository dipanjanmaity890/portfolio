const { JSDOM } = require("jsdom");
const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");

const dom = new JSDOM(html, { 
  runScripts: "dangerously", 
  resources: "usable" 
});

dom.window.addEventListener("error", (event) => {
  console.error("Runtime Error in JS:", event.error);
});

setTimeout(() => { console.log("Test finished."); }, 3000);
