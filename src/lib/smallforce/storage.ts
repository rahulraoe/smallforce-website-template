import { getSmallForceConfig } from "./config";

export type SmallForceStorageUploadPolicy = {
  method: "POST";
  url: string;
  fields: Record<string, string>;
  key: string;
  path: string;
  maxSizeBytes: number;
  expiresAt: string;
};

export type SmallForceStorageUsage = {
  sizeBytes: number;
  objectCount: number;
  checkedAt: string;
};

export type SmallForceStorageObject = {
  path: string;
  key: string;
  fileName: string;
  sizeBytes: number;
  contentType: string;
};

export type SmallForceStorageUploadResult = {
  object: SmallForceStorageObject;
  usage?: SmallForceStorageUsage;
  upload: {
    maxSizeBytes: number;
    expiresAt: string;
  };
};

export type SmallForceStorageGetResult = {
  object: {
    path: string;
    key: string;
    method: "GET";
    url: string;
  };
};

export type SmallForceStorageListObject = {
  path: string;
  key: string;
  size: number;
  etag: string | null;
  lastModified: string | null;
  storageClass: string | null;
};

export type SmallForceStorageListResult = {
  prefix: string;
  objects: SmallForceStorageListObject[];
  nextCursor: string | null;
  isTruncated: boolean;
};

export type SmallForceStorageDeleteResult = {
  path: string;
  key: string;
  deleted: boolean;
};

type StorageUploadResponse = {
  success?: boolean;
  upload?: SmallForceStorageUploadPolicy;
  usage?: SmallForceStorageUsage;
  error?: string;
  message?: string;
};

type StorageGetResponse = {
  success?: boolean;
  object?: SmallForceStorageGetResult["object"];
  error?: string;
  message?: string;
};

type StorageListResponse = Partial<SmallForceStorageListResult> & {
  success?: boolean;
  error?: string;
  message?: string;
};

type StorageDeleteResponse = Partial<SmallForceStorageDeleteResult> & {
  success?: boolean;
  error?: string;
  message?: string;
};

export class SmallForceStorageError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "SmallForceStorageError";
  }
}

export const sfStorage = {
  async createUploadPolicy(input: {
    path: string;
    contentType?: string | null;
  }): Promise<{
    upload: SmallForceStorageUploadPolicy;
    usage?: SmallForceStorageUsage;
  }> {
    const config = getSmallForceConfig();
    const response = await fetch(`${config.backendUrl}${config.runtime.storageUploadPath}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        path: normalizeStoragePath(input.path),
        contentType: input.contentType || "application/octet-stream",
      }),
    });

    const body = (await readResponseBody(response)) as StorageUploadResponse;
    if (!response.ok || !body.success || !body.upload) {
      throw new SmallForceStorageError(
        body.message || "SmallForce storage upload signing failed",
        response.status,
        body,
      );
    }

    return {
      upload: body.upload,
      usage: body.usage,
    };
  },

  async upload(
    file: File,
    input: {
      path: string;
      contentType?: string | null;
    },
  ): Promise<SmallForceStorageUploadResult> {
    if (!(file instanceof File) || file.size === 0) {
      throw new SmallForceStorageError("Choose a file to upload.", 400);
    }

    const contentType = input.contentType || file.type || "application/octet-stream";
    const fileName = sanitizeFileName(file.name);
    const { upload, usage } = await sfStorage.createUploadPolicy({
      path: input.path,
      contentType,
    });

    if (file.size > upload.maxSizeBytes) {
      throw new SmallForceStorageError(
        `File is larger than the ${formatBytes(upload.maxSizeBytes)} upload limit.`,
        413,
        { maxSizeBytes: upload.maxSizeBytes, sizeBytes: file.size },
      );
    }

    const uploadForm = new FormData();
    for (const [field, value] of Object.entries(upload.fields)) {
      uploadForm.append(field, value);
    }
    uploadForm.append("file", file, fileName);

    const uploadResponse = await fetch(upload.url, {
      method: upload.method,
      body: uploadForm,
    });

    if (!uploadResponse.ok) {
      throw new SmallForceStorageError(
        "SmallForce storage upload failed",
        uploadResponse.status,
        await readResponseBody(uploadResponse),
      );
    }

    return {
      object: {
        path: upload.path,
        key: upload.key,
        fileName,
        sizeBytes: file.size,
        contentType,
      },
      usage,
      upload: {
        maxSizeBytes: upload.maxSizeBytes,
        expiresAt: upload.expiresAt,
      },
    };
  },

  async get(input: { path: string }): Promise<SmallForceStorageGetResult> {
    const config = getSmallForceConfig();
    const url = new URL(`${config.backendUrl}${config.runtime.storageObjectPath}`);
    url.searchParams.set("path", normalizeStoragePath(input.path));

    const response = await fetch(url);
    const body = (await readResponseBody(response)) as StorageGetResponse;
    if (!response.ok || !body.success || !body.object) {
      throw new SmallForceStorageError(
        body.message || "SmallForce storage get failed",
        response.status,
        body,
      );
    }

    return { object: body.object };
  },

  async list(input: {
    prefix?: string | null;
    cursor?: string | null;
    limit?: number;
  } = {}): Promise<SmallForceStorageListResult> {
    const config = getSmallForceConfig();
    const url = new URL(`${config.backendUrl}${config.runtime.storageListPath}`);

    if (input.prefix) url.searchParams.set("prefix", normalizeStoragePrefix(input.prefix));
    if (input.cursor) url.searchParams.set("cursor", input.cursor);
    if (input.limit) url.searchParams.set("limit", String(input.limit));

    const response = await fetch(url);
    const body = (await readResponseBody(response)) as StorageListResponse;
    if (!response.ok || !body.success || !Array.isArray(body.objects)) {
      throw new SmallForceStorageError(
        body.message || "SmallForce storage list failed",
        response.status,
        body,
      );
    }

    return {
      prefix: body.prefix || "",
      objects: body.objects,
      nextCursor: body.nextCursor || null,
      isTruncated: Boolean(body.isTruncated),
    };
  },

  async delete(input: { path: string }): Promise<SmallForceStorageDeleteResult> {
    const config = getSmallForceConfig();
    const url = new URL(`${config.backendUrl}${config.runtime.storageObjectPath}`);
    url.searchParams.set("path", normalizeStoragePath(input.path));

    const response = await fetch(url, { method: "DELETE" });
    const body = (await readResponseBody(response)) as StorageDeleteResponse;
    if (!response.ok || !body.success || !body.deleted || !body.path || !body.key) {
      throw new SmallForceStorageError(
        body.message || "SmallForce storage delete failed",
        response.status,
        body,
      );
    }

    return {
      path: body.path,
      key: body.key,
      deleted: body.deleted,
    };
  },
};

export function sanitizeFileName(value: string): string {
  const cleaned = value
    .trim()
    .replaceAll("\\", "/")
    .split("/")
    .pop()
    ?.replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");

  return cleaned || "upload.bin";
}

export function normalizeStoragePath(value: string): string {
  return value.replaceAll("\\", "/").replace(/^\/+/, "").trim();
}

export function normalizeStoragePrefix(value: string): string {
  return normalizeStoragePath(value);
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const amount = value / 1024 ** exponent;

  return `${amount >= 10 || exponent === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[exponent]}`;
}
