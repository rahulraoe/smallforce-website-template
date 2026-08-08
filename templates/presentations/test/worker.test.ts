import { describe, expect, it } from "bun:test";

import worker from "../worker/entry.mjs";

describe("presentation Worker adapter", () => {
  it("redirects the application root to the default deck", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/"),
      { ASSETS: { fetch: () => Promise.resolve(new Response("unused")) } },
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://example.test/s/welcome",
    );
  });

  it("uses the OpenSlide index for client-side routes", async () => {
    const requestedPaths: string[] = [];
    const response = await worker.fetch(
      new Request("https://example.test/s/welcome/presenter"),
      {
        ASSETS: {
          async fetch(request: Request) {
            const pathname = new URL(request.url).pathname;
            requestedPaths.push(pathname);
            return pathname === "/index.html"
              ? new Response("open-slide")
              : new Response("missing", { status: 404 });
          },
        },
      },
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("open-slide");
    expect(requestedPaths).toEqual([
      "/s/welcome/presenter",
      "/index.html",
    ]);
  });
});
