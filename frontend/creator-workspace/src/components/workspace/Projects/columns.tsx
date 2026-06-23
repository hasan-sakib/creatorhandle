import type { ColumnDef } from "@tanstack/react-table"
import { Check, Copy } from "lucide-react"

import type { ProjectPublic } from "@/client"
import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { cn } from "@/lib/utils"
import { ProjectActionsMenu } from "./ProjectActionsMenu"

function CopyId({ num, id }: { num: number; id: string }) {
  const [copiedText, copy] = useCopyToClipboard()
  const isCopied = copiedText === id

  return (
    <div className="flex items-center gap-1.5 group">
      <span className="text-sm tabular-nums text-muted-foreground">{num}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copy(id)}
      >
        {isCopied ? (
          <Check className="size-3 text-green-500" />
        ) : (
          <Copy className="size-3" />
        )}
        <span className="sr-only">Copy ID</span>
      </Button>
    </div>
  )
}

const statusColors: Record<string, string> = {
  Planning: "text-blue-600 bg-blue-50 border-blue-200",
  "In Progress": "text-amber-600 bg-amber-50 border-amber-200",
  Review: "text-purple-600 bg-purple-50 border-purple-200",
  Published: "text-green-600 bg-green-50 border-green-200",
  Cancelled: "text-gray-500 bg-gray-50 border-gray-200",
}

export const columns: ColumnDef<ProjectPublic>[] = [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }) => <CopyId num={row.index + 1} id={row.original.id} />,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title}</span>
    ),
  },
  {
    accessorKey: "type",
    header: "Platform",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.type || "—"}</span>
    ),
  },
  {
    accessorKey: "platform_status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.platform_status ?? "Planning"
      return (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
            statusColors[status] ?? "text-gray-500 bg-gray-50 border-gray-200",
          )}
        >
          {status}
        </span>
      )
    },
  },
  {
    accessorKey: "deadline",
    header: "Deadline",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.deadline || "—"}</span>
    ),
  },
  {
    id: "progress",
    header: "Progress",
    cell: ({ row, table }) => {
      const meta = table.options.meta as Record<string, unknown> | undefined
      const progressMap = meta?.progressMap as Record<string, { done: number; total: number }> | undefined
      const prog = progressMap?.[row.original.id]
      if (!prog || prog.total === 0) return <span className="text-xs text-muted-foreground">—</span>
      const pct = Math.round((prog.done / prog.total) * 100)
      return (
        <div className="flex items-center gap-2 min-w-24">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground shrink-0">
            {prog.done}/{prog.total}
          </span>
        </div>
      )
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <ProjectActionsMenu project={row.original} />
      </div>
    ),
  },
]
