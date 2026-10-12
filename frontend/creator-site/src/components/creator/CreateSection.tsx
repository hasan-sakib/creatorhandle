import { Clapperboard, Hash, Radio } from "lucide-react"
import type { ComponentType } from "react"

import type { PublicCreator } from "@/client"
import { Section } from "@/components/creator/Section"
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
      <div className="glass h-full rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
            <Icon className="size-5" />
          </span>
          <h3 className="font-display text-lg font-semibold">{title}</h3>
        </div>
        <ul className="mt-5 flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-full border bg-background/60 px-3 py-1 text-sm font-medium"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  )
}

export function hasCreateContent(p: PublicCreator) {
  return p.niches.length + p.content_formats.length + p.platforms.length > 0
}

/** What the creator makes: niches, formats and platforms. */
export function CreateSection({ profile }: { profile: PublicCreator }) {
  if (!hasCreateContent(profile)) return null
  return (
    <Section id="create" eyebrow="Content" title="What I create">
      <div className="grid gap-4 md:grid-cols-3">
        <Group icon={Hash} title="Topics" items={profile.niches} delay={0} />
        <Group icon={Clapperboard} title="Formats" items={profile.content_formats} delay={100} />
        <Group icon={Radio} title="Where I publish" items={profile.platforms} delay={200} />
      </div>
    </Section>
  )
}
