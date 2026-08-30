export type ApplicationBackgroundHandlers<QueueBody = ApplicationJsonValue> = {
  queue?(
    batch: MessageBatch<QueueBody>,
    env: SmallForceApplicationEnv,
    ctx: ExecutionContext,
  ): Promise<void> | void
  scheduled?(
    controller: ScheduledController,
    env: SmallForceApplicationEnv,
    ctx: ExecutionContext,
  ): Promise<void> | void
}

/**
 * Queue and Cron handlers are added here when declared in smallforce.json.
 * WorkflowEntrypoint classes are exported from this module as named exports.
 * Keeping the object empty means this application has no background handlers.
 */
export const background: ApplicationBackgroundHandlers = {}
