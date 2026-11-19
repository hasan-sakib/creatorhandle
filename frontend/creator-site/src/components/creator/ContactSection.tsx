import { Mail } from "lucide-react"

import type { PublicCreator } from "@/client"
import { EmptyState } from "@/components/creator/EmptyState"
import { Section } from "@/components/creator/Section"
import { firstName } from "@/components/creator/sections"
import { Reveal } from "@/components/home/Reveal"
import { Button } from "@/components/ui/button"
import { safeEmail, safeHttpUrl } from "@/lib/safeUrl"
import { getSocialLinks } from "@/lib/socials"

export function hasContactMethods(p: PublicCreator) {
  return !!(
    safeEmail(p.contact_email) ||
    getSocialLinks(p).length > 0 ||
    safeHttpUrl(p.media_kit_url)
  )
}

const COPY: Record<string, string> = {
  open: "I'm open to new collaborations. Tell me about your brand and what you have in mind.",
  limited:
    "My availability is limited right now, but I'd still love to hear from you.",
  closed:
    "I'm not taking new work at the moment, but you're welcome to say hello.",
}

export function ContactSection({ profile }: { profile: PublicCreator }) {
  if (!hasContactMethods(profile)) {
    return (
      <Section id="contact" eyebrow="Contact" title="Let's work together">
        <EmptyState
          message={`${firstName(profile)} hasn't added a way to get in touch yet.`}
          settingsTab="my-profile"
        />
      </Section>
    )
  }
  const email = safeEmail(profile.contact_email)
  const links = getSocialLinks(profile)
  const mediaKit = safeHttpUrl(profile.media_kit_url)
  const name = profile.full_name || profile.username

  return (
    <Section id="contact" eyebrow="Contact" title="Let's work together">
      <Reveal>
        <div className="surface relative overflow-hidden rounded-card p-6 sm:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "color-mix(in oklch, var(--accent-raw) 30%, transparent)",
            }}
          />
          <p className="relative max-w-xl text-base text-foreground/90 sm:text-lg">
            {COPY[profile.availability ?? ""] ??
              `Get in touch with ${name} about collaborations, sponsorships or projects.`}
          </p>

          <div className="relative mt-6 flex flex-wrap gap-3">
            {email && (
              <Button asChild size="lg" className="rounded-pill px-6">
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent(`Collaboration with ${name}`)}`}
                >
                  <Mail className="size-4" /> {email}
                </a>
              </Button>
            )}
            {mediaKit && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-pill bg-background/50 px-6"
              >
                <a href={mediaKit} target="_blank" rel="noopener noreferrer">
                  Download media kit
                </a>
              </Button>
            )}
          </div>

          {links.length > 0 && (
            <ul className="relative mt-6 flex flex-wrap gap-2">
              {links.map(({ key, label, href, text, Icon }) => (
                <li key={key}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-pill border bg-background/60 px-3.5 py-1.5 text-sm transition hover:border-primary hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon className="size-4" />
                    <span className="sr-only">{label}: </span>
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>
    </Section>
  )
}
