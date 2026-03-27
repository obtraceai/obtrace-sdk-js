import { mkdirSync, writeFileSync, readdirSync, renameSync, statSync } from "fs";
import { join } from "path";

function renameJsToCjs(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      renameJsToCjs(full);
    } else if (entry.endsWith(".js")) {
      renameSync(full, full.replace(/\.js$/, ".cjs"));
    }
  }
}

writeFileSync("dist/cjs/package.json", '{"type":"commonjs"}');
renameJsToCjs("dist/cjs");
console.log("CJS build: .js → .cjs renamed");
