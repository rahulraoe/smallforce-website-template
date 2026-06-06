import { Database, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type CheckState =
  | { status: "idle"; message: string }
  | { status: "loading"; message: string }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

export function DbQuickCheck() {
  const [state, setState] = useState<CheckState>({
    status: "idle",
    message: "Run this only after db capability is enabled.",
  });

  async function runCheck() {
    setState({ status: "loading", message: "Checking database route..." });

    try {
      const response = await fetch("/api/db-example", { method: "POST" });
      const body = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.message || "Database check failed");
      }

      setState({ status: "ok", message: body.message || "Database route is ready." });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Database check failed",
      });
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">DB route check</p>
          <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
        </div>
        <Button type="button" variant="outline" onClick={runCheck} disabled={state.status === "loading"}>
          {state.status === "loading" ? <Loader2 className="animate-spin" /> : <Database />}
          Check
        </Button>
      </div>
    </div>
  );
}
