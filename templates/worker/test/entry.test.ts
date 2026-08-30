import { describe, expect, it } from "bun:test";

import worker from "../src/entry";
import type { AppEnv, WorkerExecutionContext } from "../src/runtime";

const unused = () => {
  throw new Error("Binding should not be called by this test.");
};

const env: AppEnv = {
  AI: {
    createResponse: unused,
    listModels: unused,
  },
  APP_GREETING: "ready",
  DB: { query: unused },
  INTEGRATIONS: { execute: unused },
  STORAGE: {
    createUpload: unused,
    completeUpload: unused,
    createDownload: unused,
    info: unused,
    list: unused,
    delete: unused,
  },
  TELEMETRY: {
    event: unused,
    log: unused,
  },
};

const anonymousContext: WorkerExecutionContext = {
  user: null,
  passThroughOnException() {},
  waitUntil() {},
};

const ssoContext: WorkerExecutionContext = {
  user: {
    id: "user-1",
    email: "member@example.test",
    name: "Example Member",
    imageUrl: null,
    authenticationMethod: "sso",
  },
  passThroughOnException() {},
  waitUntil() {},
};

describe("starter Worker", () => {
  it("returns health without touching application bindings", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/api/health"),
      env,
      anonymousContext,
    );

    expect(response.status).toBe(200);
    expect(await response.json<{ ok: boolean }>()).toEqual({ ok: true });
  });

  it("reads runtime variables directly from env", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/"),
      env,
      ssoContext,
    );

    expect(await response.json<{ message: string }>()).toMatchObject({
      message: "ready",
    });
  });
});
