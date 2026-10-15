import { Clapperboard, Hash, Radio } from "lucide-react"
import type { ComponentType } from "react"

import type { PublicCreator } from "@/client"
import { EmptyState } from "@/components/creator/EmptyState"
import { Section } from "@/components/creator/Section"
import { firstName } from "@/components/creator/sections"
import { Reveal } from "@/components/home/Reveal"

function Group({
  icon: Icon,
  title,
  items,
  delay,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  items: string[]
  delay: number
}) {
  if (items.length === 0) return null
  return (
    <Reveal delay={delay} className="h-full">
      <div className="surface h-full rounded-card p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-tile bg-primary/12 text-accent-text">
            <Icon className="size-5" />
          </span>
          <h3 className="font-display text-lg font-semibold">{title}</h3>
        </div>
        <ul className="mt-5 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item} className="rounded-pill border bg-background/60 px-3 py-1 text-sm font-medium">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  )
}

export function hasMakeContent(p: PublicCreator) {
  return p.niches.length + p.content_formats.length + p.platforms.length > 0
}

/**
 * About: the creator's story, and below it what they make (topics, formats,
 * platforms). The text shows a placeholder when empty; the "what I make" row
 * only appears once something is filled in.
 */
export function AboutSection({ profile }: { profile: PublicCreator }) {
  const text = profile.about || profile.bio

  return (
    <Section id="about" eyebrow="About" title="About me">
      {text ? (
        <Reveal className="surface rounded-card p-6 sm:p-10">
          <p className="max-w-3xl whitespace-pre-line text-base leading-relaxed text-foreground/90 sm:text-lg sm:leading-8">
            {text}
          </p>
        </Reveal>
      ) : (
        <EmptyState message={`${firstName(profile)} hasn't written an About yet.`} />
      )}

      {hasMakeContent(profile) && (
        <div className="mt-8">
          <h3 className="mb-4 font-display text-xl font-semibold">What I make</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Group icon={Hash} title="Topics" items={profile.niches} delay={0} />
            <Group icon={Clapperboard} title="Formats" items={profile.content_formats} delay={100} />
            <Group icon={Radio} title="Where I publish" items={profile.platforms} delay={200} />
          </div>
        </div>
      )}
    </Section>
  )
}
