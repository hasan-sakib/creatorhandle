import { Sparkles } from "lucide-react"

import type { PublicCreator } from "@/client"
import { goToSection } from "@/components/creator/GlassNavbar"
import { Section } from "@/components/creator/Section"
import { Reveal } from "@/components/home/Reveal"
import { Button } from "@/components/ui/button"

/** What brands can hire the creator for. */
export function ServicesSection({
  profile,
  hasContact,
}: {
  profile: PublicCreator
  hasContact: boolean
}) {
  if (profile.services.length === 0) return null
  return (
    <Section id="services" eyebrow="Work with me" title="What I offer brands">
      <ul className="grid gap-4 sm:grid-cols-2">
        {profile.services.map((service, i) => (
          <li key={service.title}>
            <Reveal delay={(i % 2) * 80} className="h-full">
              <div className="glass h-full rounded-3xl p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
                  <Sparkles className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{service.title}</h3>
                {service.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                )}
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
      {hasContact && profile.availability !== "closed" && (
        <div className="mt-8">
          <Button variant="outline" className="rounded-full bg-background/50" onClick={() => goToSection("contact")}>
            Start a conversation
          </Button>
        </div>
      )}
    </Section>
  )
}
