import { ArrowUpRight, ExternalLink, Star } from "lucide-react"
import { useMemo, useState } from "react"

import type { PublicProject } from "@/client"
import { EmptyState } from "@/components/creator/EmptyState"
import { SafeImage } from "@/components/creator/SafeImage"
import { GradientFallback, Section } from "@/components/creator/Section"
import { Reveal } from "@/components/home/Reveal"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { safeHttpUrl } from "@/lib/safeUrl"
import { dashboardPath } from "@/lib/urls"
import { cn } from "@/lib/utils"

function ProjectCard({
  project,
  large,
  onOpen,
}: {
  project: PublicProject
  large?: boolean
  onOpen: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(project.id)}
      className="group flex h-full w-full flex-col overflow-hidden rounded-inner border bg-card/60 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className={cn(
          "relative w-full overflow-hidden",
          large ? "aspect-[16/9]" : "aspect-[16/10]",
        )}
      >
        <SafeImage
          src={project.thumbnail_url}
          alt=""
          className="transition duration-500 group-hover:scale-105"
          fallback={
            <GradientFallback className="font-display text-4xl font-bold text-foreground/40">
              {project.title.slice(0, 1).toUpperCase()}
            </GradientFallback>
          }
        />
        <span className="absolute left-3 top-3 rounded-pill bg-background/80 px-2.5 py-0.5 text-[11px] font-medium backdrop-blur">
          {project.type}
        </span>
        {project.is_featured && (
          <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-background/80 backdrop-blur">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span className="sr-only">Featured</span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              "font-display font-semibold leading-snug",
              large ? "text-xl" : "text-base",
            )}
          >
            {project.title}
          </h3>
          <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:text-accent-text" />
        </div>
        {project.brand_name && (
          <p className="mt-1 text-xs text-muted-foreground">
            with {project.brand_name}
          </p>
        )}
        {project.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {project.description}
          </p>
        )}
        {project.tags.length > 0 && (
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-3">
            {project.tags.slice(0, 3).map((t) => (
              <li
                key={t}
                className="rounded-pill bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-accent-text"
              >
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </button>
  )
}

function ProjectDialog({
  project,
  onClose,
}: {
  project: PublicProject | null
  onClose: () => void
}) {
  const live = safeHttpUrl(project?.live_url)
  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {project && (
          <>
            <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
              <SafeImage
                src={project.thumbnail_url}
                alt=""
                fallback={
                  <GradientFallback className="font-display text-6xl font-bold text-foreground/30">
                    {project.title.slice(0, 1).toUpperCase()}
                  </GradientFallback>
                }
              />
            </div>
            <div className="space-y-4 px-6 pb-7 sm:px-8">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-pill border px-2.5 py-0.5 font-medium">
                  {project.type}
                </span>
                {project.is_featured && (
                  <span className="inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 font-medium">
                    <Star className="size-3 fill-amber-400 text-amber-400" />{" "}
                    Featured
                  </span>
                )}
              </div>
              <DialogTitle className="heading text-2xl sm:text-3xl">
                {project.title}
              </DialogTitle>
              {project.brand_name && (
                <p className="text-sm text-muted-foreground">
                  With {project.brand_name}
                </p>
              )}
              <DialogDescription asChild>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90 sm:text-base">
                  {project.description || "No description yet."}
                </p>
              </DialogDescription>
              {project.tags.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {project.tags.map((t) => (
                    <li
                      key={t}
                      className="rounded-pill bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-accent-text"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              {live && (
                <Button asChild className="rounded-pill">
                  <a href={live} target="_blank" rel="noopener noreferrer">
                    View the live piece <ExternalLink className="size-4" />
                  </a>
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-pill border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary/15 font-medium text-accent-text"
          : "bg-background/50 text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

interface WorkSectionProps {
  projects: PublicProject[]
  total: number
  /** id of the open project (kept in the URL by the page). */
  openId: string | undefined
  onOpen: (id: string) => void
  onClose: () => void
}

export function WorkSection({
  projects,
  total,
  openId,
  onOpen,
  onClose,
}: WorkSectionProps) {
  const [type, setType] = useState<string | null>(null)
  const [tag, setTag] = useState<string | null>(null)

  const types = useMemo(
    () => [...new Set(projects.map((p) => p.type))],
    [projects],
  )
  const tags = useMemo(
    () => [...new Set(projects.flatMap((p) => p.tags))].slice(0, 12),
    [projects],
  )

  const filtering = type !== null || tag !== null
  const featured = projects.filter((p) => p.is_featured).slice(0, 3)
  const featuredIds = new Set(featured.map((p) => p.id))
  const filtered = projects.filter(
    (p) =>
      (type === null || p.type === type) &&
      (tag === null || p.tags.includes(tag)),
  )
  const grid = filtering
    ? filtered
    : projects.filter((p) => !featuredIds.has(p.id))
  const open = projects.find((p) => p.id === openId) ?? null

  if (projects.length === 0) {
    return (
      <Section id="work" eyebrow="Portfolio" title="Previous work">
        <EmptyState
          message="No published projects yet."
          href={dashboardPath("/projects")}
        />
      </Section>
    )
  }

  return (
    <Section id="work" eyebrow="Portfolio" title="Previous work">
      {(types.length > 1 || tags.length > 0) && (
        <div className="mb-8 space-y-3">
          {types.length > 1 && (
            <div
              role="group"
              aria-label="Filter by platform"
              className="flex flex-wrap gap-2"
            >
              <FilterChip active={type === null} onClick={() => setType(null)}>
                All
              </FilterChip>
              {types.map((t) => (
                <FilterChip
                  key={t}
                  active={type === t}
                  onClick={() => setType(type === t ? null : t)}
                >
                  {t}
                </FilterChip>
              ))}
            </div>
          )}
          {tags.length > 0 && (
            <div
              role="group"
              aria-label="Filter by tag"
              className="flex flex-wrap gap-2"
            >
              {tags.map((t) => (
                <FilterChip
                  key={t}
                  active={tag === t}
                  onClick={() => setTag(tag === t ? null : t)}
                >
                  #{t}
                </FilterChip>
              ))}
            </div>
          )}
        </div>
      )}

      {!filtering && featured.length > 0 && (
        <div className="mb-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={i * 80} className="h-full">
              <ProjectCard project={p} large onOpen={onOpen} />
            </Reveal>
          ))}
        </div>
      )}

      {grid.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {grid.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 80} className="h-full">
              <ProjectCard project={p} onOpen={onOpen} />
            </Reveal>
          ))}
        </div>
      ) : (
        filtering && (
          <p className="text-muted-foreground">
            No projects match these filters.
          </p>
        )
      )}

      {total > projects.length && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Showing {projects.length} of {total} projects.
        </p>
      )}

      <ProjectDialog project={open} onClose={onClose} />
    </Section>
  )
}
