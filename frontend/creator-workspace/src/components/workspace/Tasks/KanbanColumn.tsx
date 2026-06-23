import type { TaskPublic } from "@/client"
import { KanbanCard } from "./KanbanCard"

interface KanbanColumnProps {
  title: string
  status: string
  tasks: TaskPublic[]
  onDragStart: (taskId: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, status: string) => void
  accentClass: string
}

export function KanbanColumn({
  title,
  status,
  tasks,
  onDragStart,
  onDragOver,
  onDrop,
  accentClass,
}: KanbanColumnProps) {
  return (
    <div
      className="flex flex-col gap-2 min-h-48 rounded-xl bg-muted/40 p-3"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`h-2 w-2 rounded-full shrink-0 ${accentClass}`} />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{tasks.length}</span>
      </div>
      {tasks.map((task) => (
        <KanbanCard key={task.id} task={task} onDragStart={onDragStart} />
      ))}
      {tasks.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground py-6">
          Drop tasks here
        </div>
      )}
    </div>
  )
}
