import { CalendarClock } from "lucide-react"

import type { ProjectPublic } from "@/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UpcomingDeadlinesProps {
  projects: ProjectPublic[]
}

function formatDeadline(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / 86400000)

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`
  return `in ${diffDays}d`
}

export function UpcomingDeadlines({ projects }: UpcomingDeadlinesProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const in7days = new Date(today.getTime() + 7 * 86400000)

  const upcoming = projects
    .filter((p) => {
      if (!p.deadline) return false
      const d = new Date(p.deadline)
      return d >= today && d <= in7days
    })
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())

  const overdue = projects.filter((p) => {
    if (!p.deadline) return false
    return new Date(p.deadline) < today && p.platform_status !== "Published" && p.platform_status !== "Cancelled"
  })

  const items = [...overdue, ...upcoming]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4 text-primary" />
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deadlines in the next 7 days.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((p) => {
              const label = p.deadline ? formatDeadline(p.deadline) : ""
              const isOverdue = p.deadline && new Date(p.deadline) < today
              return (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.platform_status}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium ${isOverdue ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`}>
                    {label}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
