/// <reference types="astro/client" />

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

interface SmallForceApplicationEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB: ApplicationDatabase;
  STORAGE: ApplicationStorage;
  [name: string]: unknown;
}

declare namespace App {
  interface Locals {
    runtime: {
      env: SmallForceApplicationEnv;
    };
  }
}
