import type { ColumnDef } from "@tanstack/react-table"
import { Check, Copy } from "lucide-react"

import type { BrandPublic } from "@/client"
import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { cn } from "@/lib/utils"
import { BrandActionsMenu } from "./BrandActionsMenu"

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
  active: "text-green-600 bg-green-50 border-green-200",
  inactive: "text-gray-500 bg-gray-50 border-gray-200",
}

export const columns: ColumnDef<BrandPublic>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <CopyId id={row.original.id} />,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.category || "—"}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status ?? "active"
      return (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize",
            statusColors[status] ?? "text-gray-500 bg-gray-50 border-gray-200",
          )}
        >
          {status}
        </span>
      )
    },
  },
  {
    accessorKey: "contact_name",
    header: "Contact",
    cell: ({ row }) => (
      <span
        className={cn(
          "text-sm",
          !row.original.contact_name && "italic text-muted-foreground",
        )}
      >
        {row.original.contact_name || "—"}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <BrandActionsMenu brand={row.original} />
      </div>
    ),
  },
]
