export type SqlValue = ArrayBuffer | string | number | boolean | null;

export type DatabaseQueryResult<
  Row extends Record<string, unknown> = Record<string, unknown>,
> = {
  columns: string[];
  rows: Row[];
  rowsRead: number;
  rowsWritten: number;
};

export type ApplicationAiMessageRole = "system" | "user" | "assistant";

export type ApplicationAi = {
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
};

export type ApplicationIntegrationJsonValue =
  | boolean
  | null
  | number
  | string
  | ApplicationIntegrationJsonValue[]
  | { [name: string]: ApplicationIntegrationJsonValue };

export type ApplicationIntegrations = {
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
};

export type ApplicationUser = {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly imageUrl: string | null;
  readonly authenticationMethod: "google" | "sso";
};

export type WorkerExecutionContext = {
  readonly user: ApplicationUser | null;
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
};

export type ApplicationBackgroundHandlers<QueueBody = unknown> = {
  queue?(
    batch: MessageBatch<QueueBody>,
    env: AppEnv,
    ctx: WorkerExecutionContext,
  ): Promise<void> | void;
  scheduled?(
    controller: ScheduledController,
    env: AppEnv,
    ctx: WorkerExecutionContext,
  ): Promise<void> | void;
};

export type AppEnv = {
  AI: ApplicationAi;
  DB: {
    query<Row extends Record<string, unknown> = Record<string, unknown>>(
      sql: string,
      params?: SqlValue[],
    ): Promise<DatabaseQueryResult<Row>>;
  };
  INTEGRATIONS: ApplicationIntegrations;
  STORAGE: {
    createUpload(input: {
      path: string;
      contentType?: string | null;
      sizeBytes: number;
    }): Promise<unknown>;
    completeUpload(input: { uploadId: string }): Promise<unknown>;
    createDownload(input: { path: string }): Promise<unknown>;
    info(): Promise<unknown>;
    list(input?: {
      cursor?: string | null;
      limit?: number;
      prefix?: string | null;
    }): Promise<unknown>;
    delete(input: { path: string }): Promise<unknown>;
  };
  [name: string]: unknown;
};

export type WorkerHandler = ApplicationBackgroundHandlers & {
  fetch(
    request: Request,
    env: AppEnv,
    ctx: WorkerExecutionContext,
  ): Promise<Response>;
};
