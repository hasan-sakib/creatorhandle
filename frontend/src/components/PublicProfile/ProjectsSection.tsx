import { CalendarDays, FolderKanban } from "lucide-react"

import type { ProjectPublic } from "@/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ProjectsSectionProps {
  projects: ProjectPublic[]
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

function ProjectCard({ project }: { project: ProjectPublic }) {
  const statusColor =
    statusColors[project.platform_status ?? "Planning"] ??
    "text-gray-600 bg-gray-50 border-gray-200"
  const platformColor =
    platformColors[project.type ?? "Other"] ??
    "text-gray-600 bg-gray-50 border-gray-200"

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight line-clamp-2 flex-1">
            {project.title}
          </h3>
          <span
            className={cn(
              "flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
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
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                platformColor,
              )}
            >
              {project.type}
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

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  if (projects.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <FolderKanban className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Projects</h2>
        <span className="text-sm text-muted-foreground ml-1">({projects.length})</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  )
}
