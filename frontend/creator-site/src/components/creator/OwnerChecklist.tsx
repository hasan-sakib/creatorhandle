import { ArrowRight, Check, Circle } from "lucide-react"

import type { PublicCreator } from "@/client"
import { hasContactMethods } from "@/components/creator/ContactSection"
import { hasCreateContent } from "@/components/creator/CreateSection"
import { dashboardPath } from "@/lib/urls"

interface Item {
  label: string
  hint: string
  done: boolean
  href: string
}

/**
 * Shown only to the profile's owner. Empty sections are hidden from visitors,
 * so this explains what is missing and links to where to add it.
 */
export function OwnerChecklist({ profile }: { profile: PublicCreator }) {
  const items: Item[] = [
    {
      label: "Headline and About",
      hint: "Tell visitors who you are and what you do",
      done: !!(profile.headline && (profile.about || profile.bio)),
      href: `${dashboardPath("/settings")}?tab=portfolio`,
    },
    {
      label: "Content you create",
      hint: "Niches, formats and platforms",
      done: hasCreateContent(profile),
      href: `${dashboardPath("/settings")}?tab=portfolio`,
    },
    {
      label: "Services and availability",
      hint: "What brands can hire you for",
      done: profile.services.length > 0 && !!profile.availability,
      href: `${dashboardPath("/settings")}?tab=portfolio`,
    },
    {
      label: "A Published project",
      hint: "Only projects with status Published appear in Selected work",
      done: profile.projects.length > 0,
      href: dashboardPath("/projects"),
    },
    {
      label: "A way to contact you",
      hint: "A public email, social links or a media kit",
      done: hasContactMethods(profile),
      href: dashboardPath("/settings"),
    },
    {
      label: "Cover image and accent color",
      hint: "Make the page look like you",
      done: !!(profile.cover_image_url && profile.accent_color),
      href: `${dashboardPath("/settings")}?tab=portfolio`,
    },
  ]

  const remaining = items.filter((i) => !i.done)
  if (remaining.length === 0) return null

  return (
    <aside
      aria-label="Complete your page"
      className="mx-auto max-w-5xl px-4 pt-2 sm:px-6"
    >
      <div className="glass rounded-3xl p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Only you see this</p>
        <h2 className="mt-1 font-display text-xl font-bold tracking-tight sm:text-2xl">
          Your page is live. Add more to fill it in.
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sections with nothing to show are hidden from visitors, so they appear here as you complete
          these ({items.length - remaining.length} of {items.length} done).
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="flex items-start gap-3 rounded-xl border bg-background/60 p-3 transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={
                    item.done
                      ? "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
                      : "mt-0.5 shrink-0 text-muted-foreground"
                  }
                >
                  {item.done ? <Check className="size-3.5" strokeWidth={3} /> : <Circle className="size-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {item.label}
                    <span className="sr-only">{item.done ? " (done)" : " (to do)"}</span>
                  </span>
                  <span className="block text-xs text-muted-foreground">{item.hint}</span>
                </span>
                {!item.done && <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
