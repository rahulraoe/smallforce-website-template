import type { APIRoute } from "astro";
import { getSmallForceConfig } from "@/lib/smallforce";

export const prerender = false;

export const GET: APIRoute = async () => {
  const config = getSmallForceConfig();

  return Response.json({
    ok: true,
    appId: config.appId || null,
    deploymentId: config.deploymentId || null,
    type: config.type,
    capabilities: config.capabilities,
  });
};
