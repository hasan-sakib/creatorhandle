import { CalendarDays, Languages, MapPin } from "lucide-react"

import type { PublicCreator } from "@/client"
import { goToSection } from "@/components/creator/GlassNavbar"
import { SafeImage } from "@/components/creator/SafeImage"
import { GradientFallback } from "@/components/creator/Section"
import { Button } from "@/components/ui/button"
import { safeHttpUrl } from "@/lib/safeUrl"
import { getSocialLinks } from "@/lib/socials"
import { cn } from "@/lib/utils"

const AVAILABILITY: Record<string, { label: string; dot: string }> = {
  open: { label: "Open to collaborations", dot: "bg-green-500" },
  limited: { label: "Limited availability", dot: "bg-amber-500" },
  closed: { label: "Not taking new work", dot: "bg-zinc-400" },
}

export function ProfileHero({ profile }: { profile: PublicCreator }) {
  const name = profile.full_name || `@${profile.username}`
  const initials = name
    .replace(/^@/, "")
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  const availability = profile.availability
    ? AVAILABILITY[profile.availability]
    : null
  const socials = getSocialLinks(profile).filter((s) => s.key !== "website")
  const mediaKit = safeHttpUrl(profile.media_kit_url)
  const since = profile.member_since
    ? new Date(profile.member_since).getFullYear()
    : null
  const stats = [
    { label: "Projects", value: profile.stats.projects_count },
    { label: "Brands", value: profile.stats.brands_count },
    { label: "Platforms", value: profile.platforms.length },
  ].filter((s) => s.value > 0)

  return (
    <header
      id="home"
      className="mx-auto max-w-5xl px-4 pb-4 pt-24 sm:px-6 sm:pt-28"
    >
      <div className="surface overflow-hidden rounded-card">
        <div className="relative h-44 sm:h-60">
          <SafeImage
            src={profile.cover_image_url}
            alt=""
            fallback={
              <GradientFallback>
                <div className="size-full bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklch,var(--accent-alt)_35%,transparent),transparent_55%)]" />
              </GradientFallback>
            }
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/70 to-transparent" />
        </div>

        <div className="px-5 pb-8 sm:px-10">
          <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="relative size-28 shrink-0 overflow-hidden rounded-avatar bg-background ring-4 ring-background shadow-xl sm:size-32">
              <SafeImage
                src={profile.avatar_url}
                alt={`${name} profile photo`}
                fallback={
                  <GradientFallback className="font-display text-3xl font-bold text-primary-foreground">
                    <span className="grid size-full place-items-center bg-gradient-to-br from-primary to-[var(--accent-alt)]">
                      {initials || "•"}
                    </span>
                  </GradientFallback>
                }
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:pb-2">
              <Button
                className="rounded-pill px-5"
                onClick={() => goToSection("contact")}
              >
                {profile.availability === "closed"
                  ? "Get in touch"
                  : "Work with me"}
              </Button>
              {mediaKit && (
                <Button
                  asChild
                  variant="outline"
                  className="rounded-pill bg-background/50 px-5"
                >
                  <a href={mediaKit} target="_blank" rel="noopener noreferrer">
                    Media kit
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h1 className="heading text-4xl sm:text-5xl">{name}</h1>
            {profile.headline && (
              <p className="mt-2 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                {profile.headline}
              </p>
            )}

            <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {profile.full_name && (
                <li className="font-medium text-foreground">
                  @{profile.username}
                </li>
              )}
              {profile.location && (
                <li className="flex items-center gap-1.5">
                  <MapPin className="size-4" /> {profile.location}
                </li>
              )}
              {profile.languages.length > 0 && (
                <li className="flex items-center gap-1.5">
                  <Languages className="size-4" />{" "}
                  {profile.languages.join(", ")}
                </li>
              )}
              {since && (
                <li className="flex items-center gap-1.5">
                  <CalendarDays className="size-4" /> On CreatorHandle since{" "}
                  {since}
                </li>
              )}
            </ul>

            {availability && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-pill border bg-background/60 px-3 py-1 text-sm font-medium">
                <span
                  className={cn("size-2 rounded-full", availability.dot)}
                  aria-hidden="true"
                />
                {availability.label}
              </p>
            )}

            {(socials.length > 0 || stats.length > 0) && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                {socials.length > 0 && (
                  <ul
                    className="flex flex-wrap gap-2"
                    aria-label="Social links"
                  >
                    {socials.map(({ key, label, href, text, Icon }) => (
                      <li key={key}>
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${label}: ${text}`}
                          title={`${label}: ${text}`}
                          className="grid size-10 place-items-center rounded-pill border bg-background/60 text-foreground transition hover:-translate-y-0.5 hover:border-primary hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Icon className="size-[18px]" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {stats.length > 0 && (
                  <dl className="inline-flex divide-x rounded-inner border bg-background/60">
                    {stats.map((s) => (
                      <div key={s.label} className="px-5 py-2 text-center">
                        <dd className="font-display text-xl font-bold leading-tight">
                          {s.value}
                        </dd>
                        <dt className="text-[11px] text-muted-foreground">
                          {s.label}
                        </dt>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
