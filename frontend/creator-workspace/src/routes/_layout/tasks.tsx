import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { CheckSquare, LayoutGrid, List } from "lucide-react"
import { Suspense, useCallback, useMemo, useState } from "react"

import { TasksService } from "@/client"
import { TableFilters } from "@/components/Common/TableFilters"
import { DataTable } from "@/components/Common/DataTable"
import { Button } from "@/components/ui/button"
import AddTask from "@/components/workspace/Tasks/AddTask"
import { columns } from "@/components/workspace/Tasks/columns"
import { KanbanBoard } from "@/components/workspace/Tasks/KanbanBoard"
import PendingItems from "@/components/workspace/Pending/PendingItems"

function getTasksQueryOptions() {
  return {
    queryFn: () => TasksService.readTasks({ skip: 0, limit: 100 }),
    queryKey: ["tasks"],
  }
}

export const Route = createFileRoute("/_layout/tasks")({
  component: Tasks,
  head: () => ({
    meta: [{ title: "Tasks - CreatorHandle" }],
  }),
})

const STATUS_OPTIONS = [
  { label: "To Do", value: "To Do" },
  { label: "In Progress", value: "In Progress" },
  { label: "Done", value: "Done" },
]

const PRIORITY_OPTIONS = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
]

function TasksContent({
  search,
  statusFilter,
  priorityFilter,
  view,
}: {
  search: string
  statusFilter: string
  priorityFilter: string
  view: "table" | "kanban"
}) {
  const { data: tasks } = useSuspenseQuery(getTasksQueryOptions())

  const filtered = useMemo(() => {
    let data = tasks.data
    if (search) {
      const q = search.toLowerCase()
      data = data.filter((t) => t.title.toLowerCase().includes(q))
    }
    if (statusFilter !== "all") {
      data = data.filter((t) => t.status === statusFilter)
    }
    if (priorityFilter !== "all") {
      data = data.filter((t) => t.priority === priorityFilter)
    }
    return data
  }, [tasks.data, search, statusFilter, priorityFilter])

  if (tasks.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <CheckSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No tasks yet</h3>
        <p className="text-muted-foreground">Add your first task to start tracking work</p>
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No tasks match your search.
      </div>
    )
  }

  if (view === "kanban") {
    return <KanbanBoard tasks={filtered} />
  }

  return <DataTable columns={columns} data={filtered} />
}

function Tasks() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [view, setView] = useState<"table" | "kanban">(() => {
    try {
      return (localStorage.getItem("tasks-view") as "table" | "kanban") ?? "table"
    } catch {
      return "table"
    }
  })

  const toggleView = useCallback((v: "table" | "kanban") => {
    setView(v)
    try { localStorage.setItem("tasks-view", v) } catch {}
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Track and manage your to-dos</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-none px-3 h-9 ${view === "table" ? "bg-accent" : ""}`}
              onClick={() => toggleView("table")}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-none px-3 h-9 border-l border-border ${view === "kanban" ? "bg-accent" : ""}`}
              onClick={() => toggleView("kanban")}
              title="Kanban view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <AddTask />
        </div>
      </div>
      <TableFilters
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tasks..."
        filterOptions={STATUS_OPTIONS}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterPlaceholder="Filter by status"
        secondaryFilterOptions={PRIORITY_OPTIONS}
        secondaryFilterValue={priorityFilter}
        onSecondaryFilterChange={setPriorityFilter}
        secondaryFilterPlaceholder="Filter by priority"
      />
      <Suspense fallback={<PendingItems />}>
        <TasksContent
          search={search}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          view={view}
        />
      </Suspense>
    </div>
  )
}
