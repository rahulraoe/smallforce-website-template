/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

type SqlValue = ArrayBuffer | string | number | boolean | null;

interface ApplicationDatabase {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: SqlValue[],
  ): Promise<{
    columns: string[];
    rows: Row[];
    rowsRead: number;
    rowsWritten: number;
  }>;
}

interface ApplicationStorage {
  createUpload(input: {
    path: string;
    contentType?: string | null;
    sizeBytes: number;
  }): Promise<{
    upload: {
      expiresAt: string;
      fields: Record<string, string>;
      maxSizeBytes: number;
      method: "POST";
      path: string;
      sizeBytes: number;
      uploadId: string;
      url: string;
    };
  }>;
  completeUpload(input: { uploadId: string }): Promise<{
    completed: true;
    path: string;
    sizeBytes: number;
  }>;
  createDownload(input: { path: string }): Promise<{
    download: {
      expiresAt: string;
      method: "GET";
      path: string;
      url: string;
    };
  }>;
  info(): Promise<{
    storage: {
      initialized: boolean;
      maxBytes: number;
      maxObjects: number;
      objectCount: number;
      reservedBytes: number;
      reservedObjects: number;
      usedBytes: number;
    };
  }>;
  list(input?: {
    cursor?: string | null;
    limit?: number;
    prefix?: string | null;
  }): Promise<{
    cursor: string | null;
    objects: Array<{
      etag: string | null;
      lastModified: string | null;
      path: string;
      sizeBytes: number;
    }>;
    prefix: string;
    truncated: boolean;
  }>;
  delete(input: { path: string }): Promise<{ deleted: true; path: string }>;
}

type ApplicationAiMessageRole = "system" | "user" | "assistant";

interface ApplicationAi {
  listModels(): Promise<{
    defaultModelId: string;
    models: Array<{
      id: string;
      name: string;
      provider: string;
      description: string | null;
      contextWindow: number;
      maxOutputTokens: number;
      capabilities: {
        input: readonly ["text"];
        output: readonly ["text"];
        reasoning: boolean;
        structuredOutput: boolean;
      };
    }>;
  }>;
  createResponse(input: {
    model: string;
    input:
      | string
      | Array<{ role: ApplicationAiMessageRole; content: string }>;
    maxOutputTokens?: number;
    temperature?: number;
  }): Promise<{
    id: string;
    model: string;
    outputText: string;
    finishReason: "stop" | "length" | "content_filter";
  }>;
}

type ApplicationIntegrationJsonValue =
  | boolean
  | null
  | number
  | string
  | ApplicationIntegrationJsonValue[]
  | { [name: string]: ApplicationIntegrationJsonValue };

interface ApplicationIntegrations {
  execute(input: {
    connectionId: string;
    toolKey: string;
    arguments?: { [name: string]: ApplicationIntegrationJsonValue };
  }): Promise<{
    data: ApplicationIntegrationJsonValue | null;
    headers: Readonly<Record<string, string>>;
    ok: boolean;
    providerRequestId: string | null;
    status: number | null;
  }>;
}

interface ApplicationTelemetry {
  event(input: {
    name: string;
    attributes?: Readonly<Record<string, unknown>>;
  }): Promise<{ readonly accepted: boolean }>;
  log(input: {
    level: "debug" | "info" | "warn" | "error";
    message: string;
    fields?: Readonly<Record<string, unknown>>;
    stack?: string | null;
  }): Promise<{ readonly accepted: boolean }>;
}

interface SmallForceApplicationUser {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly imageUrl: string | null;
  readonly authenticationMethod: "google" | "sso";
}

interface SmallForceApplicationEnv {
  AI: ApplicationAi;
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB: ApplicationDatabase;
  INTEGRATIONS: ApplicationIntegrations;
  STORAGE: ApplicationStorage;
  TELEMETRY: ApplicationTelemetry;
  [name: string]: unknown;
}

declare namespace Cloudflare {
  interface Env extends SmallForceApplicationEnv {}
}

interface ExecutionContext<Props = unknown> {
  /** Null for public and shared-password requests. */
  readonly user: SmallForceApplicationUser | null;
}
