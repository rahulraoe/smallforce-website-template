import { describe, expect, it } from "bun:test";

import worker from "../src/entry";
import type { AppEnv } from "../src/runtime";

const unused = () => {
  throw new Error("Binding should not be called by this test.");
};

const env = {
  APP_GREETING: "ready",
  DB: { query: unused },
  STORAGE: {
    createUpload: unused,
    completeUpload: unused,
    createDownload: unused,
    info: unused,
    list: unused,
    delete: unused,
  },
} as unknown as AppEnv;

describe("starter Worker", () => {
  it("returns health without touching application bindings", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/api/health"),
      env,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("reads runtime variables directly from env", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/"),
      env,
    );

    expect(await response.json()).toMatchObject({ message: "ready" });
  });
});
