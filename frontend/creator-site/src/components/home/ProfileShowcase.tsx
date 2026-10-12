import { Check } from "lucide-react"

import { ProfilePageMock } from "@/components/home/ExampleProfile"
import { Reveal } from "@/components/home/Reveal"

// Each point reflects what the public profile endpoint actually returns.
const points = [
  "Your story, niches and services, so brands see what you do",
  "Published projects and the brands behind them, featured work first",
  "You choose when it goes live, and can unpublish at any time",
  "Tasks, notes and brand contacts are never shown",
]

export function ProfileShowcase() {
  return (
    <section id="profile" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Your work, one link
          </h2>
          <p className="mt-4 text-muted-foreground">
            Send brands a single, tidy page instead of a pile of links. It updates as you update
            your workspace.
          </p>
          <ul className="mt-8 space-y-4">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120}>
          <div
            aria-hidden="true"
            className="overflow-hidden rounded-2xl border bg-card shadow-xl"
          >
            <div className="flex items-center gap-3 border-b bg-muted/50 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-red-400/70" />
                <span className="size-2.5 rounded-full bg-amber-400/70" />
                <span className="size-2.5 rounded-full bg-green-400/70" />
              </div>
              <div className="mx-auto w-full max-w-xs truncate rounded-md border bg-background px-3 py-1 text-center text-xs text-muted-foreground">
                creatorhandle.com/@yourhandle
              </div>
              <span className="w-10" />
            </div>
            <ProfilePageMock />
          </div>
          <p className="sr-only">Illustration of an example creator profile page.</p>
        </Reveal>
      </div>
    </section>
  )
}
