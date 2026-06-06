export type SmallForceAppType = "static" | "content" | "fullstack";

export type SmallForceConfig = {
  appId: string;
  deploymentId: string;
  name: string;
  slug: string;
  type: SmallForceAppType;
  capabilities: {
    db: boolean;
  };
  backendUrl: string;
  runtime: {
    dbQueryPath: string;
  };
  deploymentUrl: string;
};

export type SmallForceDbParam = string | number | boolean | null;

export type SmallForceDbQueryResult<Row = Record<string, unknown>> = {
  results?: Row[];
  success?: boolean;
  meta?: Record<string, unknown>;
  error?: string;
};
