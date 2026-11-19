import { ArrowRight, Check, Circle } from "lucide-react"

import type { PublicCreator } from "@/client"
import { hasMakeContent } from "@/components/creator/AboutSection"
import { hasApproachContent } from "@/components/creator/ApproachSection"
import { hasContactMethods } from "@/components/creator/ContactSection"
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
  const portfolioTab = `${dashboardPath("/settings")}?tab=portfolio`
  const items: Item[] = [
    {
      label: "Headline and About",
      hint: "Tell visitors who you are and what you do",
      done: !!(profile.headline && (profile.about || profile.bio)),
      href: portfolioTab,
    },
    {
      label: "What you make",
      hint: "Topics, formats and platforms (shown under About)",
      done: hasMakeContent(profile),
      href: portfolioTab,
    },
    {
      label: "Work style",
      hint: "Your process steps, principles and tools",
      done: hasApproachContent(profile),
      href: portfolioTab,
    },
    {
      label: "Work list",
      hint: "The services you offer, and your availability",
      done: profile.services.length > 0 && !!profile.availability,
      href: portfolioTab,
    },
    {
      label: "Previous work",
      hint: "Only projects with status Published appear here",
      done: profile.projects.length > 0,
      href: dashboardPath("/projects"),
    },
    {
      label: "A way to contact you",
      hint: "A public email, social links or a media kit",
      done: hasContactMethods(profile),
      href: `${dashboardPath("/settings")}?tab=my-profile`,
    },
    {
      label: "Cover image and theme",
      hint: "Make the page look like you",
      done: !!(
        profile.cover_image_url &&
        (profile.theme || profile.accent_color)
      ),
      href: portfolioTab,
    },
  ]

  const remaining = items.filter((i) => !i.done)
  if (remaining.length === 0) return null

  return (
    <aside
      aria-label="Complete your page"
      className="mx-auto max-w-5xl px-4 pt-2 sm:px-6"
    >
      <div className="surface rounded-card p-5 sm:p-6">
        <p className="eyebrow">Only you see this</p>
        <h2 className="mt-1 heading text-xl sm:text-2xl">
          Your page is live. Add more to fill it in.
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every profile has the same sections. Ones you haven't filled in show a
          short placeholder to visitors ({items.length - remaining.length} of{" "}
          {items.length} done).
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="flex items-start gap-3 rounded-tile border bg-background/60 p-3 transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={
                    item.done
                      ? "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
                      : "mt-0.5 shrink-0 text-muted-foreground"
                  }
                >
                  {item.done ? (
                    <Check className="size-3.5" strokeWidth={3} />
                  ) : (
                    <Circle className="size-5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {item.label}
                    <span className="sr-only">
                      {item.done ? " (done)" : " (to do)"}
                    </span>
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {item.hint}
                  </span>
                </span>
                {!item.done && (
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
