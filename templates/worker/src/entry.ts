import type { AppEnv, WorkerHandler } from "./runtime";
import { background } from "./background";

export * from "./background";

function json(value: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(value, { ...init, headers });
}

async function handle(request: Request, env: AppEnv): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/health") {
    return json({ ok: true });
  }

  if (request.method === "GET" && url.pathname === "/") {
    return json({
      ok: true,
      service: "smallforce-api-worker",
      message:
        typeof env.APP_GREETING === "string"
          ? env.APP_GREETING
          : "Replace this starter route with the customer's API.",
    });
  }

  return json(
    { ok: false, error: { code: "not_found", message: "Route not found." } },
    { status: 404 },
  );
}

const worker: WorkerHandler = {
  ...background,
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch (error) {
      const requestId = crypto.randomUUID();
      console.error("worker_request_failed", {
        requestId,
        method: request.method,
        path: new URL(request.url).pathname,
        error: error instanceof Error ? error.message : String(error),
      });
      return json(
        {
          ok: false,
          error: {
            code: "internal_error",
            message: "Internal server error.",
            requestId,
          },
        },
        { status: 500 },
      );
    }
  },
};

export default worker;
