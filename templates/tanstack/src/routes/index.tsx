import { createFileRoute } from "@tanstack/react-router"
import { PanelsTopLeftIcon } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export const Route = createFileRoute("/")({
  component: WorkspacePage,
})

function WorkspacePage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header className="max-w-2xl">
        <p className="text-sm font-medium text-muted-foreground">Application</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Workspace</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Replace this starter route with the customer&apos;s primary workflow.
        </p>
      </header>
      <Empty className="min-h-80 border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PanelsTopLeftIcon />
          </EmptyMedia>
          <EmptyTitle>Build the first workflow</EmptyTitle>
          <EmptyDescription>
            Start from the real job the customer needs to complete, then add navigation,
            data, and actions around it.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
