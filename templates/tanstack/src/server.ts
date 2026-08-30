import handler from "@tanstack/react-start/server-entry"

import { background } from "@/background"

export * from "@/background"

function shouldResolveStaticAsset(request: Request): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return false
  }
  const pathname = new URL(request.url).pathname
  const lastSegment = pathname.split("/").at(-1) ?? ""
  return pathname.startsWith("/assets/") || lastSegment.includes(".")
}

/**
 * SmallForce loads this module as the application's public Worker entrypoint.
 * TanStack handles HTTP rendering and server functions. The adjacent background
 * exports keep standard Cloudflare Workflow, Queue, and Cron authoring shapes.
 */
export default {
  ...background,
  async fetch(request, env, ctx) {
    // Cloudflare normally serves Vite's immutable browser output before the
    // Worker runs. Dynamic Workers do not have that outer asset router, so the
    // platform entry performs the equivalent lookup for asset-shaped paths.
    if (shouldResolveStaticAsset(request)) {
      const asset = await env.ASSETS.fetch(request)
      if (asset.status !== 404) {
        return asset
      }
      await asset.body?.cancel()
    }
    return handler.fetch(request, {
      context: {
        user: ctx.user ?? null,
      },
    })
  },
} satisfies ExportedHandler<SmallForceApplicationEnv, ApplicationJsonValue>
