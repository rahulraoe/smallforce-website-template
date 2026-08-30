import astroWorker from "../dist/server/entry.mjs";
import { background } from "../src/background.ts";

export * from "../src/background.ts";

export default {
  ...background,
  fetch(request, env, ctx) {
    return astroWorker.fetch(request, env, ctx);
  },
};
