import type { ColumnDef } from "@tanstack/react-table"
import { Check, Copy } from "lucide-react"

import type { TaskPublic } from "@/client"
import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { cn } from "@/lib/utils"
import { TaskActionsMenu } from "./TaskActionsMenu"

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
  "To Do": "text-gray-500 bg-gray-50 border-gray-200",
  "In Progress": "text-blue-600 bg-blue-50 border-blue-200",
  Done: "text-green-600 bg-green-50 border-green-200",
}

const priorityColors: Record<string, string> = {
  Low: "text-green-600 bg-green-50 border-green-200",
  Medium: "text-amber-600 bg-amber-50 border-amber-200",
  High: "text-red-600 bg-red-50 border-red-200",
}

export const columns: ColumnDef<TaskPublic>[] = [
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status ?? "To Do"
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
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.original.priority ?? "Medium"
      return (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
            priorityColors[priority] ?? "text-gray-500 bg-gray-50 border-gray-200",
          )}
        >
          {priority}
        </span>
      )
    },
  },
  {
    accessorKey: "due_date",
    header: "Due Date",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.due_date || "—"}</span>
    ),
  },
  {
    id: "assigned_to",
    header: "Assigned To",
    cell: ({ row }) => {
      const c = row.original.collaborator
      if (!c) return <span className="text-sm text-muted-foreground">—</span>
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{c.name}</span>
          <span className="text-xs text-muted-foreground">{c.role}</span>
        </div>
      )
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <TaskActionsMenu task={row.original} />
      </div>
    ),
  },
]
