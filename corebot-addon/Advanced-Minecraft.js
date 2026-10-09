const fs = require("fs");
const path = require("path");
const Module = require("module");

const sourceDirectory = path.join(__dirname, "source");
const source = fs
  .readdirSync(sourceDirectory)
  .filter((name) => /^Advanced-Minecraft\.part\d+$/.test(name))
  .sort()
  .map((name) => fs.readFileSync(path.join(sourceDirectory, name), "utf8"))
  .join("");

const compiled = new Module(module.filename, module.parent);
compiled.filename = module.filename;
compiled.paths = module.paths;
compiled._compile(source, module.filename);

module.exports = compiled.exports;
