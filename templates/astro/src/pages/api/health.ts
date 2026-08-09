import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const result = await env.DB.query<{ healthy: number }>(
      "SELECT 1 AS healthy",
    );
    const healthy = result.rows[0]?.healthy === 1;

    return Response.json(
      { ok: healthy },
      {
        status: healthy ? 200 : 503,
        headers: { "cache-control": "no-store" },
      },
    );
  } catch (error) {
    console.error("SmallForce application health check failed", error);
    return Response.json(
      { ok: false },
      {
        status: 503,
        headers: { "cache-control": "no-store" },
      },
    );
  }
};
