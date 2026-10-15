import { Sparkles } from "lucide-react"

import type { PublicCreator } from "@/client"
import { EmptyState } from "@/components/creator/EmptyState"
import { goToSection } from "@/components/creator/GlassNavbar"
import { Section } from "@/components/creator/Section"
import { firstName } from "@/components/creator/sections"
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
  return (
    <Section id="services" eyebrow="Work list" title="What I do">
      {profile.services.length === 0 ? (
        <EmptyState
          message={`${firstName(profile)} hasn't listed services yet.${hasContact ? " Get in touch to ask what's possible." : ""}`}
        />
      ) : (
      <ul className="grid gap-4 sm:grid-cols-2">
        {profile.services.map((service, i) => (
          <li key={service.title}>
            <Reveal delay={(i % 2) * 80} className="h-full">
              <div className="surface h-full rounded-card p-6">
                <span className="grid size-10 place-items-center rounded-tile bg-primary/12 text-accent-text">
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
      )}
      {profile.services.length > 0 && hasContact && profile.availability !== "closed" && (
        <div className="mt-8">
          <Button variant="outline" className="rounded-pill bg-background/50" onClick={() => goToSection("contact")}>
            Start a conversation
          </Button>
        </div>
      )}
    </Section>
  )
}
