import { readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const budgetKb = 320;

const files = readdirSync("dist/assets")
  .filter((f) => f.endsWith(".js"))
  .map((f) => `dist/assets/${f}`);

let total = 0;
for (const file of files) {
  const size = gzipSync(readFileSync(file)).length;
  total += size;
  console.log(`${file}: ${(size / 1024).toFixed(2)} kB (gzip)`);
}

const kb = total / 1024;
console.log(`Total: ${kb.toFixed(2)} kB (gzip) — budget ${budgetKb} kB`);

if (total > budgetKb * 1024) {
  console.error("Bundle size exceeds budget.");
  process.exit(1);
}
