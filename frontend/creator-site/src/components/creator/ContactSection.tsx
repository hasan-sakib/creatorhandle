import { Mail } from "lucide-react"

import type { CreatorProfile } from "@/client"

interface ContactSectionProps {
  profile: CreatorProfile
}

function SocialButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-4 py-2 rounded-full border text-sm font-medium
        bg-background hover:bg-muted transition-colors"
    >
      {label}
    </a>
  )
}

export function ContactSection({ profile }: ContactSectionProps) {
  const socialLinks = [
    profile.twitter && {
      href: `https://x.com/${profile.twitter.replace(/^@/, "")}`,
      label: "X / Twitter",
    },
    profile.instagram && {
      href: `https://instagram.com/${profile.instagram.replace(/^@/, "")}`,
      label: "Instagram",
    },
    profile.youtube && {
      href: profile.youtube.startsWith("http")
        ? profile.youtube
        : `https://youtube.com/@${profile.youtube.replace(/^@/, "")}`,
      label: "YouTube",
    },
    profile.tiktok && {
      href: `https://tiktok.com/@${profile.tiktok.replace(/^@/, "")}`,
      label: "TikTok",
    },
    profile.website && {
      href: profile.website.startsWith("http") ? profile.website : `https://${profile.website}`,
      label: "Website",
    },
  ].filter(Boolean) as { href: string; label: string }[]

  if (!profile.contact_email && socialLinks.length === 0) return null

  return (
    <section className="rounded-2xl border bg-muted/30 px-8 py-10 text-center space-y-5">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold">Work With Me</h2>
        {profile.bio && (
          <p className="text-muted-foreground text-sm max-w-sm mx-auto line-clamp-2">{profile.bio}</p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {profile.contact_email && (
          <a
            href={`mailto:${profile.contact_email}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
              bg-primary text-primary-foreground text-sm font-medium
              hover:opacity-90 transition-opacity"
          >
            <Mail className="w-4 h-4" />
            Get in Touch
          </a>
        )}
        {socialLinks.map((link) => (
          <SocialButton key={link.label} href={link.href} label={link.label} />
        ))}
      </div>
    </section>
  )
}
