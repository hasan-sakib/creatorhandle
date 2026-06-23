import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo } from "react"

import { BrandsService, ProjectsService, TasksService } from "@/client"
import { QuickActions } from "@/components/workspace/Dashboard/QuickActions"
import { StatsGrid } from "@/components/workspace/Dashboard/StatsGrid"
import { TaskStatusBreakdown } from "@/components/workspace/Dashboard/TaskStatusBreakdown"
import { UpcomingDeadlines } from "@/components/workspace/Dashboard/UpcomingDeadlines"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard - CreatorHandle" }] }),
})

function Dashboard() {
  const { user: currentUser } = useAuth()
  const displayName = currentUser?.full_name || currentUser?.email || ""

  const { data: brandsData, isLoading: brandsLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: () => BrandsService.readBrands({ skip: 0, limit: 1000 }),
  })

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => ProjectsService.readProjects({ skip: 0, limit: 1000 }),
  })

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => TasksService.readTasks({ skip: 0, limit: 1000 }),
  })

  const loading = brandsLoading || projectsLoading || tasksLoading

  const stats = useMemo(() => {
    const totalBrands = brandsData?.data?.length ?? 0
    const totalProjects = projectsData?.data?.length ?? 0
    const tasks = tasksData?.data ?? []
    const doneTasks = tasks.filter((t) => t.status === "Done").length
    return { totalBrands, totalProjects, totalTasks: tasks.length, doneTasks }
  }, [brandsData, projectsData, tasksData])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Hi, {displayName} 👋
        </h1>
        <p className="mt-2 text-lg text-muted-foreground font-medium">
          Welcome back, nice to see you again!
        </p>
      </div>

      <StatsGrid {...stats} loading={loading} />

      <div className="grid gap-4 md:grid-cols-2">
        <UpcomingDeadlines projects={projectsData?.data ?? []} />
        <TaskStatusBreakdown tasks={tasksData?.data ?? []} />
      </div>

      <QuickActions />
    </div>
  )
}
