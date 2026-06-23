import type { TaskPublic } from "@/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TaskStatusBreakdownProps {
  tasks: TaskPublic[]
}

export function TaskStatusBreakdown({ tasks }: TaskStatusBreakdownProps) {
  const todo = tasks.filter((t) => t.status === "To Do").length
  const inProgress = tasks.filter((t) => t.status === "In Progress").length
  const done = tasks.filter((t) => t.status === "Done").length
  const total = tasks.length

  const pills = [
    { label: "To Do", count: todo, color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    { label: "In Progress", count: inProgress, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "Done", count: done, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Task Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
        ) : (
          <>
            <div className="mb-3 flex gap-2 flex-wrap">
              {pills.map((p) => (
                <span key={p.label} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${p.color}`}>
                  <span className="tabular-nums font-bold">{p.count}</span>
                  {p.label}
                </span>
              ))}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              {total > 0 && (
                <div className="flex h-full">
                  {todo > 0 && <div className="bg-slate-400" style={{ width: `${(todo / total) * 100}%` }} />}
                  {inProgress > 0 && <div className="bg-blue-400" style={{ width: `${(inProgress / total) * 100}%` }} />}
                  {done > 0 && <div className="bg-green-500" style={{ width: `${(done / total) * 100}%` }} />}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
