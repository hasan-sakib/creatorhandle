import { CalendarDays, FolderKanban, Star, X } from "lucide-react"
import { useMemo, useState } from "react"

import type { BrandPublic, ProjectPublic } from "@/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface ProjectsSectionProps {
  projects: ProjectPublic[]
  brands?: BrandPublic[]
  isLoading?: boolean
  brandFilter?: string | null
}

const statusColors: Record<string, string> = {
  Planning: "text-blue-600 bg-blue-50 border-blue-200",
  "In Progress": "text-amber-600 bg-amber-50 border-amber-200",
  Review: "text-purple-600 bg-purple-50 border-purple-200",
  Published: "text-green-600 bg-green-50 border-green-200",
}

const platformColors: Record<string, string> = {
  YouTube: "text-red-600 bg-red-50 border-red-200",
  TikTok: "text-pink-600 bg-pink-50 border-pink-200",
  Instagram: "text-orange-600 bg-orange-50 border-orange-200",
  Twitch: "text-violet-600 bg-violet-50 border-violet-200",
  Blog: "text-teal-600 bg-teal-50 border-teal-200",
  Other: "text-gray-600 bg-gray-50 border-gray-200",
}

function ProjectCard({
  project,
  brandName,
  onClick,
}: {
  project: ProjectPublic
  brandName?: string
  onClick: () => void
}) {
  const statusColor =
    statusColors[project.platform_status ?? "Planning"] ?? "text-gray-600 bg-gray-50 border-gray-200"
  const platformColor =
    platformColors[project.type ?? "Other"] ?? "text-gray-600 bg-gray-50 border-gray-200"

  return (
    <Card
      className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight line-clamp-2 flex-1">{project.title}</h3>
          <span
            className={cn(
              "shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
              statusColor,
            )}
          >
            {project.platform_status ?? "Planning"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex flex-wrap gap-2">
          {project.type && project.type !== "Other" && (
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", platformColor)}>
              {project.type}
            </span>
          )}
          {brandName && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-muted/60 text-muted-foreground border-border">
              {brandName}
            </span>
          )}
        </div>
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        )}
        {project.deadline && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Due {project.deadline}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FeaturedCard({
  project,
  brandName,
  onClick,
}: {
  project: ProjectPublic
  brandName?: string
  onClick: () => void
}) {
  const statusColor =
    statusColors[project.platform_status ?? "Planning"] ?? "text-gray-600 bg-gray-50 border-gray-200"

  return (
    <Card
      className="min-w-65 max-w-75 shrink-0 hover:shadow-lg transition-shadow duration-200 cursor-pointer border-primary/20"
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
          <Star className="w-3.5 h-3.5 fill-current" />
          Featured
        </div>
        <h3 className="font-semibold leading-tight line-clamp-2">{project.title}</h3>
        <div className="flex flex-wrap gap-1.5">
          {project.type && (
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", platformColors[project.type] ?? platformColors["Other"])}>
              {project.type}
            </span>
          )}
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", statusColor)}>
            {project.platform_status ?? "Planning"}
          </span>
        </div>
        {brandName && (
          <p className="text-xs text-muted-foreground">{brandName}</p>
        )}
        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function ProjectDrawer({
  project,
  brandName,
  onClose,
}: {
  project: ProjectPublic
  brandName?: string
  onClose: () => void
}) {
  const statusColor =
    statusColors[project.platform_status ?? "Planning"] ?? "text-gray-600 bg-gray-50 border-gray-200"
  const platformColor =
    platformColors[project.type ?? "Other"] ?? "text-gray-600 bg-gray-50 border-gray-200"

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-background rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background flex items-center justify-between px-6 pt-6 pb-4 border-b">
          <h2 className="font-bold text-lg leading-tight pr-4">{project.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {project.type && (
              <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium border", platformColor)}>
                {project.type}
              </span>
            )}
            <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium border", statusColor)}>
              {project.platform_status ?? "Planning"}
            </span>
            {project.is_featured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium border bg-amber-50 text-amber-600 border-amber-200">
                <Star className="w-3.5 h-3.5 fill-current" /> Featured
              </span>
            )}
          </div>

          {project.description && (
            <p className="text-sm leading-relaxed text-foreground/80">{project.description}</p>
          )}

          <div className="space-y-2 text-sm">
            {brandName && (
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground w-20">Brand</span>
                <span className="font-medium">{brandName}</span>
              </div>
            )}
            {project.deadline && (
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground w-20">Deadline</span>
                <span className="font-medium">{project.deadline}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-16 rounded-full shrink-0" />
      </div>
      <Skeleton className="h-3.5 w-1/3 rounded-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

const PLATFORM_FILTERS = ["All", "YouTube", "TikTok", "Instagram", "Twitch", "Blog", "Other"]

export function ProjectsSection({
  projects,
  brands,
  isLoading,
  brandFilter,
}: ProjectsSectionProps) {
  const [platformFilter, setPlatformFilter] = useState("All")
  const [selectedProject, setSelectedProject] = useState<ProjectPublic | null>(null)

  const brandMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const b of brands ?? []) map[b.id] = b.name
    return map
  }, [brands])

  const brandFiltered = useMemo(() => {
    if (!brandFilter) return projects
    return projects.filter((p) => p.brand_id === brandFilter)
  }, [projects, brandFilter])

  const featured = useMemo(() => brandFiltered.filter((p) => p.is_featured), [brandFiltered])

  const platformFiltered = useMemo(() => {
    const base = brandFiltered.filter((p) => !p.is_featured)
    if (platformFilter === "All") return base
    return base.filter((p) => p.type === platformFilter)
  }, [brandFiltered, platformFilter])

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of brandFiltered) {
      if (p.type) counts[p.type] = (counts[p.type] ?? 0) + 1
    }
    return counts
  }, [brandFiltered])

  const availablePlatforms = useMemo(
    () => PLATFORM_FILTERS.filter((f) => f === "All" || platformCounts[f]),
    [platformCounts],
  )

  const drawerBrandName = selectedProject?.brand_id ? brandMap[selectedProject.brand_id] : undefined

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <ProjectCardSkeleton key={i} />)}
        </div>
      </section>
    )
  }

  if (projects.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Projects</h2>
        </div>
        <div className="py-12 text-center rounded-xl border border-dashed">
          <FolderKanban className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No projects yet — check back soon.</p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Projects</h2>
          <span className="text-sm text-muted-foreground ml-1">({brandFiltered.length})</span>
        </div>

        {featured.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Featured Work</p>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {featured.map((p) => (
                <FeaturedCard
                  key={p.id}
                  project={p}
                  brandName={p.brand_id ? brandMap[p.brand_id] : undefined}
                  onClick={() => setSelectedProject(p)}
                />
              ))}
            </div>
          </div>
        )}

        {availablePlatforms.length > 2 && (
          <div className="flex flex-wrap gap-2">
            {availablePlatforms.map((plat) => (
              <button
                key={plat}
                type="button"
                onClick={() => setPlatformFilter(plat)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-colors border",
                  platformFilter === plat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted",
                )}
              >
                {plat}
                {plat !== "All" && platformCounts[plat] ? (
                  <span className="ml-1.5 text-xs opacity-70">{platformCounts[plat]}</span>
                ) : null}
              </button>
            ))}
          </div>
        )}

        {platformFiltered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platformFiltered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                brandName={project.brand_id ? brandMap[project.brand_id] : undefined}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">No projects match this filter.</p>
        )}

        {Object.keys(platformCounts).length > 1 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {Object.entries(platformCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([platform, count]) => (
                <span key={platform} className="text-xs text-muted-foreground">
                  {platform} ({count})
                  {Object.keys(platformCounts).indexOf(platform) < Object.keys(platformCounts).length - 1 ? " ·" : ""}
                </span>
              ))}
          </div>
        )}
      </section>

      {selectedProject && (
        <ProjectDrawer
          project={selectedProject}
          brandName={drawerBrandName}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  )
}
