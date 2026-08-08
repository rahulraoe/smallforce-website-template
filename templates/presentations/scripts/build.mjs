import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

rmSync("dist", { force: true, recursive: true });

const slides = spawnSync("bun", ["run", "build:slides"], {
  stdio: "inherit",
});

if (slides.error) throw slides.error;
if (slides.status !== 0) {
  throw new Error(
    `OpenSlide build exited with code ${slides.status ?? "unknown"}.`,
  );
}

mkdirSync("dist/worker", { recursive: true });
copyFileSync("worker/entry.mjs", "dist/worker/entry.mjs");
