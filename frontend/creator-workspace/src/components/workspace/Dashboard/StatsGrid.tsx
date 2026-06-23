import { Building2, CheckSquare, FolderKanban, TrendingUp } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface StatsGridProps {
  totalBrands: number
  totalProjects: number
  totalTasks: number
  doneTasks: number
  loading?: boolean
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  loading,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  sub?: string
  loading?: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
            </div>
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StatsGrid({ totalBrands, totalProjects, totalTasks, doneTasks, loading }: StatsGridProps) {
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard icon={Building2} label="Total Brands" value={totalBrands} loading={loading} />
      <StatCard icon={FolderKanban} label="Total Projects" value={totalProjects} loading={loading} />
      <StatCard icon={CheckSquare} label="Tasks Done" value={doneTasks} sub={`of ${totalTasks} total`} loading={loading} />
      <StatCard icon={TrendingUp} label="Completion" value={`${completionPct}%`} sub="tasks completed" loading={loading} />
    </div>
  )
}
