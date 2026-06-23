import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FolderKanban } from "lucide-react"
import { Suspense, useMemo, useState } from "react"

import { ProjectsService, TasksService } from "@/client"
import { TableFilters } from "@/components/Common/TableFilters"
import { DataTable } from "@/components/Common/DataTable"
import AddProject from "@/components/workspace/Projects/AddProject"
import { columns } from "@/components/workspace/Projects/columns"
import PendingItems from "@/components/workspace/Pending/PendingItems"

function getProjectsQueryOptions() {
  return {
    queryFn: () => ProjectsService.readProjects({ skip: 0, limit: 100 }),
    queryKey: ["projects"],
  }
}

export const Route = createFileRoute("/_layout/projects")({
  component: Projects,
  head: () => ({
    meta: [{ title: "Projects - CreatorHandle" }],
  }),
})

const STATUS_OPTIONS = [
  { label: "Planning", value: "Planning" },
  { label: "In Progress", value: "In Progress" },
  { label: "Review", value: "Review" },
  { label: "Published", value: "Published" },
  { label: "Cancelled", value: "Cancelled" },
]

function ProjectsTableContent({
  search,
  statusFilter,
}: {
  search: string
  statusFilter: string
}) {
  const { data: projects } = useSuspenseQuery(getProjectsQueryOptions())

  const { data: tasksData } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => TasksService.readTasks({ skip: 0, limit: 1000 }),
  })

  const progressMap = useMemo(() => {
    const map: Record<string, { done: number; total: number }> = {}
    for (const task of tasksData?.data ?? []) {
      if (!task.project_id) continue
      if (!map[task.project_id]) map[task.project_id] = { done: 0, total: 0 }
      map[task.project_id].total++
      if (task.status === "Done") map[task.project_id].done++
    }
    return map
  }, [tasksData])

  const filtered = useMemo(() => {
    let data = projects.data
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.type ?? "").toLowerCase().includes(q),
      )
    }
    if (statusFilter !== "all") {
      data = data.filter((p) => p.platform_status === statusFilter)
    }
    return data
  }, [projects.data, search, statusFilter])

  if (projects.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FolderKanban className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No projects yet</h3>
        <p className="text-muted-foreground">Create your first content project to get started</p>
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No projects match your search.
      </div>
    )
  }

  return <DataTable columns={columns} data={filtered} meta={{ progressMap }} />
}

function Projects() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your content projects</p>
        </div>
        <AddProject />
      </div>
      <TableFilters
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search projects..."
        filterOptions={STATUS_OPTIONS}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterPlaceholder="Filter by status"
      />
      <Suspense fallback={<PendingItems />}>
        <ProjectsTableContent search={search} statusFilter={statusFilter} />
      </Suspense>
    </div>
  )
}
