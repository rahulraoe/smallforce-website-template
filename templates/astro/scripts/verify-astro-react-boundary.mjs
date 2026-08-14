import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const sourceRoot = "src";
const violations = [];

for (const path of astroFiles(sourceRoot)) {
  const source = readFileSync(path, "utf8");
  if (/from\s+["'][^"']*components\/ui\/[^"']+["']/.test(source)) {
    violations.push(relative(process.cwd(), path));
  }
}

if (violations.length > 0) {
  console.error(
    [
      "Do not import React shadcn/ui components directly into .astro files.",
      "Compose them in a .tsx component, then import that component into Astro:",
      ...violations.map((path) => `- ${path}`),
    ].join("\n"),
  );
  process.exitCode = 1;
}

function* astroFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* astroFiles(path);
    } else if (entry.isFile() && entry.name.endsWith(".astro")) {
      yield path;
    }
  }
}
