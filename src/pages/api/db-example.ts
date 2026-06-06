import type { APIRoute } from "astro";
import { sfDb, SmallForceDbError } from "@/lib/smallforce";

export const prerender = false;

export const POST: APIRoute = async () => {
  try {
    await sfDb.query("SELECT 1 AS ok", []);

    return Response.json({
      ok: true,
      message: "SmallForce DB query route responded.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "SmallForce DB query route is not available.";

    return Response.json(
      {
        ok: false,
        message,
        status: error instanceof SmallForceDbError ? error.status : undefined,
      },
      { status: 400 },
    );
  }
};
