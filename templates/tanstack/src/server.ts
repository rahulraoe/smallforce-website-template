import handler from "@tanstack/react-start/server-entry"

import { background } from "@/background"

export * from "@/background"

/**
 * SmallForce loads this module as the application's public Worker entrypoint.
 * TanStack handles HTTP rendering and server functions. The adjacent background
 * exports keep standard Cloudflare Workflow, Queue, and Cron authoring shapes.
 */
export default {
  ...background,
  fetch(request, _env, ctx) {
    return handler.fetch(request, {
      context: {
        user: ctx.user ?? null,
      },
    })
  },
} satisfies ExportedHandler<SmallForceApplicationEnv, ApplicationJsonValue>
