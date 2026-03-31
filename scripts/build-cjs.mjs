import { writeFileSync, readdirSync, renameSync, readFileSync, statSync } from "fs";
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

function fixRequirePaths(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      fixRequirePaths(full);
    } else if (entry.endsWith(".cjs")) {
      let content = readFileSync(full, "utf8");
      const updated = content.replace(/require\("(\.[^"]+)"\)/g, (match, p) => {
        if (p.endsWith(".js")) return `require("${p.replace(/\.js$/, ".cjs")}")`;
        if (!p.endsWith(".cjs") && !p.endsWith(".json")) return `require("${p}.cjs")`;
        return match;
      });
      if (updated !== content) writeFileSync(full, updated);
    }
  }
}

writeFileSync("dist/cjs/package.json", '{"type":"commonjs"}');
renameJsToCjs("dist/cjs");
fixRequirePaths("dist/cjs");
console.log("CJS build: .js → .cjs renamed, require paths fixed");
