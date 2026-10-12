import type { PublicCreator } from "@/client"
import { Section } from "@/components/creator/Section"
import { Reveal } from "@/components/home/Reveal"

/** The long "About" text, falling back to the short bio. Plain text only: never rendered as HTML. */
export function AboutSection({ profile }: { profile: PublicCreator }) {
  const text = profile.about || profile.bio
  if (!text) return null

  return (
    <Section id="about" eyebrow="About" title={profile.headline ? "A little about me" : `Hi, I'm ${profile.full_name || profile.username}`}>
      <Reveal className="glass rounded-3xl p-6 sm:p-10">
        <p className="max-w-3xl whitespace-pre-line text-base leading-relaxed text-foreground/90 sm:text-lg sm:leading-8">
          {text}
        </p>
      </Reveal>
    </Section>
  )
}
