import { useQuery } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import { Check } from "lucide-react"

import { ProjectsService, type UserPublic } from "@/client"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/providers/workspace-provider"

// ─── Page structure ─────────────────────────────────────────────────────────

function hasContactInfo(u: UserPublic) {
  return !!(
    u.contact_email ||
    u.website ||
    u.twitter ||
    u.instagram ||
    u.youtube ||
    u.tiktok ||
    u.media_kit_url
  )
}

/** The fixed sections every portfolio page has, with what is filled in. */
export function StructureCard({ user }: { user: UserPublic }) {
  const { activeWorkspaceId } = useWorkspace()
  const { data: projects } = useQuery({
    queryKey: ["projects", activeWorkspaceId],
    queryFn: () => ProjectsService.readProjects({ skip: 0, limit: 1000 }),
  })
  const published = (projects?.data ?? []).filter(
    (p) => p.platform_status === "Published",
  )

  const jump = (id: string) =>
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })

  const sections: {
    name: string
    page: string
    done: boolean
    target: string | { to: string; tab?: string }
  }[] = [
    {
      name: "Home",
      page: "Name, headline, photo and cover",
      done: !!(user.headline && (user.avatar_url || user.cover_image_url)),
      target: "card-about",
    },
    {
      name: "About",
      page: "Your story, and what you make",
      done: !!(user.about || user.bio),
      target: "card-about",
    },
    {
      name: "Approach (Work style)",
      page: "Process steps, principles and tools",
      done:
        (user.work_steps?.length ?? 0) +
          (user.work_principles?.length ?? 0) +
          (user.work_tools?.length ?? 0) >
        0,
      target: "card-approach",
    },
    {
      name: "Services (Work list)",
      page: "What you do for clients",
      done: (user.services?.length ?? 0) > 0,
      target: "card-services",
    },
    {
      name: "Work (Previous work)",
      page: "Your Published projects",
      done: published.length > 0,
      target: { to: "/projects" },
    },
    {
      name: "Brands",
      page: "Brands tied to published projects",
      done: published.some((p) => p.brand_id),
      target: { to: "/projects" },
    },
    {
      name: "Contact",
      page: "An email, social links or media kit",
      done: hasContactInfo(user),
      target: { to: "/settings", tab: "my-profile" },
    },
  ]

  return (
    <section className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Your page has these sections</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Every portfolio page has the same sections, in this order. Sections you
        haven't filled in show a short placeholder to visitors.
      </p>
      <ol className="divide-y rounded-lg border">
        {sections.map((s, i) => (
          <li
            key={s.name}
            className="flex items-center gap-3 px-4 py-2.5 text-sm"
          >
            <span className="w-5 shrink-0 text-muted-foreground">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="font-medium">{s.name}</span>
              <span className="block text-xs text-muted-foreground">
                {s.page}
              </span>
            </span>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                s.done
                  ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {s.done && <Check className="size-3" />}
              {s.done ? "Filled in" : "Empty"}
            </span>
            {typeof s.target === "string" ? (
              <button
                type="button"
                onClick={() => jump(s.target as string)}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                Edit
              </button>
            ) : (
              <RouterLink
                to={s.target.to}
                search={s.target.tab ? { tab: s.target.tab } : undefined}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                Edit
              </RouterLink>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
