import { ExternalLink } from "lucide-react"

import useAuth from "@/hooks/useAuth"
import { AboutCard } from "./portfolio/AboutCard"
import { ContentCard } from "./portfolio/ContentCard"
import { LookCard } from "./portfolio/LookCard"
import { ServicesCard } from "./portfolio/ServicesCard"
import { StructureCard } from "./portfolio/StructureCard"
import { WorkStyleCard } from "./portfolio/WorkStyleCard"

// ─── tab ────────────────────────────────────────────────────────────────────

const PortfolioSettings = () => {
  const { user } = useAuth()
  if (!user) return null
  const profileUrl = user.username
    ? `${window.location.origin}/@${user.username}`
    : null

  return (
    <div className="max-w-3xl space-y-6">
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Your public portfolio</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Visitors see your profile, the niches and services you fill in below,
          your <strong>Published</strong> projects (featured first) and the
          brands tied to them. Planning work, tasks, brand notes and brand
          contacts are never shown.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          {profileUrl && user.is_published ? (
            <a
              href={profileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              View your public page <ExternalLink className="size-3.5" />
            </a>
          ) : (
            <span className="text-muted-foreground">
              {profileUrl
                ? "Your page is not live yet. Publish it from the My profile tab."
                : "Set a public handle in the My profile tab first."}
            </span>
          )}
        </div>
      </section>

      <StructureCard user={user} />
      <AboutCard user={user} />
      <ContentCard user={user} />
      <WorkStyleCard user={user} />
      <ServicesCard user={user} />
      <LookCard user={user} />
    </div>
  )
}

export default PortfolioSettings
