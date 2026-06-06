import manifest from "../../../smallforce.json";
import type { SmallForceAppType, SmallForceConfig } from "./types";

const DEFAULT_BACKEND_URL = "https://backend.smallforcehq.com";
const APP_TYPES = new Set<string>(["static", "content", "fullstack"]);

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getSmallForceConfig(): SmallForceConfig {
  const configuredBackendUrl = import.meta.env.SMALLFORCE_BACKEND_URL || manifest.backendUrl;

  return {
    appId: manifest.appId,
    deploymentId: manifest.deploymentId,
    name: manifest.name,
    slug: manifest.slug,
    type: normalizeAppType(manifest.type),
    capabilities: {
      db: Boolean(manifest.capabilities.db),
    },
    backendUrl: trimTrailingSlash(configuredBackendUrl || DEFAULT_BACKEND_URL),
    runtime: {
      ...manifest.runtime,
      dbQueryPath: manifest.runtime.dbQueryPath || "/internal/apps/runtime/db/query",
    },
    deploymentUrl: manifest.deploymentUrl,
  };
}

function normalizeAppType(value: string): SmallForceAppType {
  if (APP_TYPES.has(value)) {
    return value as SmallForceAppType;
  }

  return "static";
}

export function requireSmallForceDeploymentContext() {
  const config = getSmallForceConfig();

  if (!config.appId || !config.deploymentId) {
    throw new Error(
      "SmallForce appId and latest deploymentId are missing. Create the app and deploy it with the SmallForce CLI, then update smallforce.json.",
    );
  }

  return config;
}
