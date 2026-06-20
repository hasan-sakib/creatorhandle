import type { ColumnDef } from "@tanstack/react-table"
import { Check, Copy } from "lucide-react"

import type { ProjectPublic } from "@/client"
import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { cn } from "@/lib/utils"
import { ProjectActionsMenu } from "./ProjectActionsMenu"

function CopyId({ id }: { id: string }) {
  const [copiedText, copy] = useCopyToClipboard()
  const isCopied = copiedText === id

  return (
    <div className="flex items-center gap-1.5 group">
      <span className="font-mono text-xs text-muted-foreground">{id}</span>
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
    header: "ID",
    cell: ({ row }) => <CopyId id={row.original.id} />,
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
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <ProjectActionsMenu project={row.original} />
      </div>
    ),
  },
]
