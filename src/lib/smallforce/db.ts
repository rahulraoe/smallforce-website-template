import { getSmallForceConfig } from "./config";
import type { SmallForceDbParam, SmallForceDbQueryResult } from "./types";

export class SmallForceDbError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "SmallForceDbError";
  }
}

export const sfDb = {
  async query<Row = Record<string, unknown>>(
    sql: string,
    params: SmallForceDbParam[] = [],
  ): Promise<SmallForceDbQueryResult<Row>> {
    const config = getSmallForceConfig();

    if (!config.capabilities.db) {
      throw new SmallForceDbError(
        "This app has not requested the db capability. Set capabilities.db=true and deploy with {\"db\":true}.",
      );
    }

    const response = await fetch(`${config.backendUrl}${config.runtime.dbQueryPath}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    });

    const body = await readResponseBody(response);

    if (!response.ok) {
      throw new SmallForceDbError("SmallForce DB query failed", response.status, body);
    }

    return body as SmallForceDbQueryResult<Row>;
  },
};

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
