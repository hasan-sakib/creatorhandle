import { Check } from "lucide-react"
import { type CSSProperties, useState } from "react"

import { ProfilePageMock } from "@/components/home/ExampleProfile"
import { Reveal } from "@/components/home/Reveal"
import { ACCENTS } from "@/lib/accent"
import { cn } from "@/lib/utils"
import { THEMES, type ThemeKey, useThemeFont } from "@/lib/themes"

// Each point reflects what the public profile actually offers.
const points = [
  "One clean layout for everyone, filled in from your dashboard",
  "Your work style, services and previous work, in the same sections on every page",
  "Pick a theme, an accent color and light or dark mode",
  "You choose when it goes live; tasks, notes and brand contacts stay private",
]

// A few of the themes, to show the same layout wearing different looks
const SHOWN: ThemeKey[] = ["studio", "editorial", "bold", "mono"]

export function ProfileShowcase() {
  const [theme, setTheme] = useState<ThemeKey>("studio")
  const accent = ACCENTS[THEMES[theme].defaultAccent]
  useThemeFont(theme) // lazy-load the selected theme's display font

  return (
    <section id="profile" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Your work, one link</h2>
          <p className="mt-4 text-muted-foreground">
            Every portfolio has the same sections, so brands always know where to look. You bring the content and
            pick the look.
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
          <div role="radiogroup" aria-label="Preview a theme" className="mb-3 flex flex-wrap gap-2">
            {SHOWN.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={theme === key}
                onClick={() => setTheme(key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  theme === key
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {THEMES[key].label}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
            <div className="flex items-center gap-3 border-b bg-muted/50 px-4 py-3" aria-hidden="true">
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
            <div
              aria-hidden="true"
              data-theme={theme}
              data-accent={THEMES[theme].defaultAccent}
              style={{ "--accent-light": accent.light, "--accent-dark": accent.dark } as CSSProperties}
              className="bg-background text-foreground"
            >
              <ProfilePageMock />
            </div>
          </div>
          <p className="sr-only">
            Illustration of an example creator portfolio, which can be shown in several themes.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
