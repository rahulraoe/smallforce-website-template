export type SqlValue = ArrayBuffer | string | number | boolean | null;

export type DatabaseQueryResult<
  Row extends Record<string, unknown> = Record<string, unknown>,
> = {
  columns: string[];
  rows: Row[];
  rowsRead: number;
  rowsWritten: number;
};

export type AppEnv = {
  DB: {
    query<Row extends Record<string, unknown> = Record<string, unknown>>(
      sql: string,
      params?: SqlValue[],
    ): Promise<DatabaseQueryResult<Row>>;
  };
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

export type WorkerHandler = {
  fetch(request: Request, env: AppEnv): Promise<Response>;
};
