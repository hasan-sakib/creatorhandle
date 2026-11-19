import { Instagram, Music2, PenLine, Twitch, Youtube } from "lucide-react"

// The project types you can track in the dashboard.
const platforms = [
  { label: "YouTube", icon: Youtube },
  { label: "TikTok", icon: Music2 },
  { label: "Instagram", icon: Instagram },
  { label: "Twitch", icon: Twitch },
  { label: "Blog", icon: PenLine },
]

export function PlatformStrip() {
  return (
    <section
      aria-label="Platforms you can track work across"
      className="border-y bg-muted/30"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-center sm:gap-8 sm:px-6">
        <p className="text-sm text-muted-foreground">Track work across</p>
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {platforms.map(({ label, icon: Icon }) => (
            <li
              key={label}
              className="flex items-center gap-2 text-sm font-medium text-foreground/80"
            >
              <Icon className="size-4 text-muted-foreground" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
