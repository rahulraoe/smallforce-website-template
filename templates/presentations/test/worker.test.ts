import { describe, expect, it } from "bun:test";

import worker from "../worker/entry.mjs";

describe("presentation Worker adapter", () => {
  it("serves the Slidev application at the root", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/"),
      {
        ASSETS: {
          fetch: () => Promise.resolve(new Response("slidev")),
        },
      },
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("slidev");
  });

  it("uses the Slidev index for client-side routes", async () => {
    const requestedPaths: string[] = [];
    const response = await worker.fetch(
      new Request("https://example.test/presenter"),
      {
        ASSETS: {
          async fetch(request: Request) {
            const pathname = new URL(request.url).pathname;
            requestedPaths.push(pathname);
            return pathname === "/index.html"
              ? new Response("slidev")
              : new Response("missing", { status: 404 });
          },
        },
      },
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("slidev");
    expect(requestedPaths).toEqual(["/presenter", "/index.html"]);
  });

  it("does not rewrite failed mutation requests", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/missing", { method: "POST" }),
      {
        ASSETS: {
          fetch: () => Promise.resolve(new Response("missing", { status: 404 })),
        },
      },
    );

    expect(response.status).toBe(404);
  });
});
