const DEFAULT_DECK = "welcome";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json(
        { ok: true },
        { headers: { "cache-control": "no-store" } },
      );
    }

    if (url.pathname === "/") {
      return new Response(null, {
        status: 302,
        headers: {
          "cache-control": "no-store",
          location: new URL(`/s/${DEFAULT_DECK}`, url).toString(),
        },
      });
    }

    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;
    await response.body?.cancel();

    if (request.method !== "GET" && request.method !== "HEAD") {
      return response;
    }

    // OpenSlide is a client-side application. Unknown presentation routes
    // must load its index so React Router can resolve them in the browser.
    return env.ASSETS.fetch(
      new Request(new URL("/index.html", request.url), request),
    );
  },
};
