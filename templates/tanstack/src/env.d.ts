/// <reference types="@cloudflare/workers-types" />

type ApplicationJsonValue =
  | boolean
  | null
  | number
  | string
  | ApplicationJsonValue[]
  | { [name: string]: ApplicationJsonValue }

type SqlValue = ArrayBuffer | boolean | null | number | string
type SqlRow = { [column: string]: SqlValue }

interface ApplicationDatabase {
  query<Row extends object = SqlRow>(
    sql: string,
    params?: SqlValue[],
  ): Promise<{
    columns: string[]
    rows: Row[]
    rowsRead: number
    rowsWritten: number
  }>
}

interface ApplicationStorage {
  createUpload(input: {
    path: string
    contentType?: string | null
    sizeBytes: number
  }): Promise<{
    upload: {
      expiresAt: string
      fields: { [name: string]: string }
      maxSizeBytes: number
      method: "POST"
      path: string
      sizeBytes: number
      uploadId: string
      url: string
    }
  }>
  completeUpload(input: { uploadId: string }): Promise<{
    completed: true
    path: string
    sizeBytes: number
  }>
  createDownload(input: { path: string }): Promise<{
    download: {
      expiresAt: string
      method: "GET"
      path: string
      url: string
    }
  }>
  info(): Promise<{
    storage: {
      initialized: boolean
      maxBytes: number
      maxObjects: number
      objectCount: number
      reservedBytes: number
      reservedObjects: number
      usedBytes: number
    }
  }>
  list(input?: {
    cursor?: string | null
    limit?: number
    prefix?: string | null
  }): Promise<{
    cursor: string | null
    objects: Array<{
      etag: string | null
      lastModified: string | null
      path: string
      sizeBytes: number
    }>
    prefix: string
    truncated: boolean
  }>
  delete(input: { path: string }): Promise<{ deleted: true; path: string }>
}

type ApplicationAiMessageRole = "assistant" | "system" | "user"

interface ApplicationAi {
  listModels(): Promise<{
    defaultModelId: string
    models: Array<{
      id: string
      name: string
      provider: string
      description: string | null
      contextWindow: number
      maxOutputTokens: number
      capabilities: {
        input: readonly ["text"]
        output: readonly ["text"]
        reasoning: boolean
        structuredOutput: boolean
      }
    }>
  }>
  createResponse(input: {
    model: string
    input: string | Array<{ role: ApplicationAiMessageRole; content: string }>
    maxOutputTokens?: number
    temperature?: number
  }): Promise<{
    id: string
    model: string
    outputText: string
    finishReason: "content_filter" | "length" | "stop"
  }>
}

interface ApplicationIntegrations {
  execute(input: {
    connectionId: string
    toolKey: string
    arguments?: { [name: string]: ApplicationJsonValue }
  }): Promise<{
    data: ApplicationJsonValue | null
    headers: Readonly<{ [name: string]: string }>
    ok: boolean
    providerRequestId: string | null
    status: number | null
  }>
}

interface ApplicationTelemetry {
  event(input: {
    name: string
    attributes?: Readonly<{ [name: string]: ApplicationJsonValue }>
  }): Promise<{ readonly accepted: boolean }>
  log(input: {
    level: "debug" | "error" | "info" | "warn"
    message: string
    fields?: Readonly<{ [name: string]: ApplicationJsonValue }>
    stack?: string | null
  }): Promise<{ readonly accepted: boolean }>
}

interface SmallForceApplicationUser {
  readonly id: string
  readonly email: string
  readonly name: string | null
  readonly imageUrl: string | null
  readonly authenticationMethod: "google" | "sso"
}

/**
 * Add every application-specific variable, secret, Queue, and Workflow binding
 * explicitly. Keeping this interface closed makes accidental binding names a
 * type error instead of silently producing undefined at runtime.
 */
interface SmallForceApplicationEnv {
  AI: ApplicationAi
  ASSETS: { fetch(request: Request): Promise<Response> }
  DB: ApplicationDatabase
  INTEGRATIONS: ApplicationIntegrations
  STORAGE: ApplicationStorage
  TELEMETRY: ApplicationTelemetry
}

interface SmallForceRequestContext {
  /** Null for public and shared-password requests. */
  readonly user: SmallForceApplicationUser | null
}

declare namespace Cloudflare {
  interface Env extends SmallForceApplicationEnv {}
}

interface ExecutionContext<Props> {
  /** Immutable SmallForce identity for this request, when platform auth applies. */
  readonly user: SmallForceApplicationUser | null
}
