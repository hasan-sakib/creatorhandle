import { useState } from "react"

import type { TaskPublic } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TaskEditDialog } from "./TaskEditDialog"

interface KanbanCardProps {
  task: TaskPublic
  onDragStart: (taskId: string) => void
}

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  Medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  High: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function KanbanCard({ task, onDragStart }: KanbanCardProps) {
  const [editOpen, setEditOpen] = useState(false)

  return (
    <>
      <Card
        draggable
        onDragStart={() => onDragStart(task.id)}
        onClick={() => setEditOpen(true)}
        className="cursor-pointer select-none hover:shadow-md transition-shadow active:opacity-75"
      >
        <CardContent className="p-3">
          <p className="text-sm font-medium leading-snug">{task.title}</p>
          <div className="mt-2 flex items-center justify-between gap-1 flex-wrap">
            {task.priority && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLORS[task.priority] ?? ""}`}
              >
                {task.priority}
              </Badge>
            )}
            {task.due_date && (
              <span className="text-[10px] text-muted-foreground ml-auto">
                {formatDate(task.due_date)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <TaskEditDialog task={task} open={editOpen} onOpenChange={setEditOpen} />
    </>
  )
}
