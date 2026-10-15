import { Skeleton } from "@/components/ui/skeleton"

interface StatsGridProps {
  totalBrands: number
  totalProjects: number
  totalTasks: number
  doneTasks: number
  loading?: boolean
}

function Stat({
  label,
  value,
  sub,
  loading,
}: {
  label: string
  value: number | string
  sub?: string
  loading?: boolean
}) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <p className="mt-1.5 text-[28px] font-semibold leading-none tracking-tight tabular-nums">{value}</p>
      )}
      <p className="mt-2 h-4 text-xs text-muted-foreground">{!loading && sub}</p>
    </div>
  )
}

export function StatsGrid({ totalBrands, totalProjects, totalTasks, doneTasks, loading }: StatsGridProps) {
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Stat label="Total Brands" value={totalBrands} loading={loading} />
      <Stat label="Total Projects" value={totalProjects} loading={loading} />
      <Stat label="Tasks Done" value={doneTasks} sub={`of ${totalTasks} total`} loading={loading} />
      <Stat label="Completion" value={`${completionPct}%`} sub="tasks completed" loading={loading} />
    </div>
  )
}
