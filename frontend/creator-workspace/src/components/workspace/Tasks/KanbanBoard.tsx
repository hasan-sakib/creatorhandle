import { useQueryClient } from "@tanstack/react-query"
import { useRef } from "react"

import type { TaskPublic } from "@/client"
import { TasksService } from "@/client"
import { KanbanColumn } from "./KanbanColumn"

interface KanbanBoardProps {
  tasks: TaskPublic[]
}

const COLUMNS = [
  { title: "To Do", status: "To Do", accent: "bg-slate-400" },
  { title: "In Progress", status: "In Progress", accent: "bg-blue-400" },
  { title: "Done", status: "Done", accent: "bg-green-500" },
]

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  const queryClient = useQueryClient()
  const draggingId = useRef<string | null>(null)

  function handleDragStart(taskId: string) {
    draggingId.current = taskId
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(e: React.DragEvent, newStatus: string) {
    e.preventDefault()
    const taskId = draggingId.current
    if (!taskId) return
    draggingId.current = null

    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    queryClient.setQueryData<{ data: TaskPublic[] }>(["tasks"], (old) => {
      if (!old) return old
      return {
        ...old,
        data: old.data.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t,
        ),
      }
    })

    TasksService.updateTask({
      id: taskId,
      requestBody: { status: newStatus },
    }).catch(() => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    })
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {COLUMNS.map((col) => (
        <KanbanColumn
          key={col.status}
          title={col.title}
          status={col.status}
          tasks={tasks.filter((t) => t.status === col.status)}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          accentClass={col.accent}
        />
      ))}
    </div>
  )
}
