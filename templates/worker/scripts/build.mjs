import { rmSync } from "node:fs";

rmSync("dist", { force: true, recursive: true });

const bundle = await Bun.build({
  entrypoints: ["src/entry.ts"],
  format: "esm",
  naming: "entry.mjs",
  outdir: "dist/worker",
  target: "browser",
});

if (!bundle.success) {
  for (const log of bundle.logs) console.error(log);
  throw new Error("Worker build failed.");
}
