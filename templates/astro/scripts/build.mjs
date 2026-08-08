import { rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

const astro = spawnSync("bun", ["run", "build:astro"], {
  stdio: "inherit",
});

if (astro.error) throw astro.error;
if (astro.status !== 0) {
  throw new Error(`Astro build exited with code ${astro.status ?? "unknown"}.`);
}

// Astro's Cloudflare adapter emits a valid Worker module graph. SmallForce
// artifacts deliberately contain JavaScript modules only, so bundle that
// graph into one portable module while leaving browser assets untouched.
rmSync("dist/worker", { force: true, recursive: true });
const bundle = await Bun.build({
  entrypoints: ["dist/server/entry.mjs"],
  external: ["cloudflare:workers"],
  format: "esm",
  naming: "entry.mjs",
  outdir: "dist/worker",
  target: "browser",
});

if (!bundle.success) {
  for (const log of bundle.logs) console.error(log);
  throw new Error("Astro Worker bundling failed.");
}
