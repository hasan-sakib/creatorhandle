import { Check, Link } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import type { CreatorProfile } from "@/client"

interface CreatorHeroProps {
  profile: CreatorProfile
}

function getInitials(fullName: string | null, username: string): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  return username.slice(0, 2).toUpperCase()
}

function getMemberYear(createdAt: string | null): string {
  if (!createdAt) return ""
  const year = new Date(createdAt).getFullYear()
  return isNaN(year) ? "" : `Member since ${year}`
}

function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || target === 0) { setCount(0); return }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const steps = Math.ceil(duration / 16)
      let step = 0
      const tick = () => {
        step++
        setCount(Math.round((step / steps) * target))
        if (step < steps) requestAnimationFrame(tick)
        else setCount(target)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.2 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return [count, ref] as const
}

function AnimatedStat({ value, label }: { value: number; label: string }) {
  const [count, ref] = useCountUp(value)
  return (
    <div ref={ref} className="flex flex-col items-center px-6 py-4 min-w-[90px]">
      <span className="text-2xl font-bold text-primary tabular-nums">{count}</span>
      <span className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  )
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </a>
  )
}

const STATS = [
  { key: "brands_count" as const, label: "Brands" },
  { key: "projects_count" as const, label: "Projects" },
  { key: "tasks_done" as const, label: "Tasks Done" },
  { key: "tasks_total" as const, label: "Total Tasks" },
]

export function CreatorHero({ profile }: CreatorHeroProps) {
  const initials = getInitials(profile.full_name, profile.username)
  const memberSince = getMemberYear(profile.created_at)
  const [copied, setCopied] = useState(false)

  const copyProfileUrl = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const pct = profile.stats.tasks_total > 0
    ? Math.round((profile.stats.tasks_done / profile.stats.tasks_total) * 100)
    : 0

  const socialLinks = [
    profile.website && { href: profile.website.startsWith("http") ? profile.website : `https://${profile.website}`, label: "Website", text: profile.website.replace(/^https?:\/\//, "") },
    profile.twitter && { href: `https://x.com/${profile.twitter.replace(/^@/, "")}`, label: "X / Twitter", text: `@${profile.twitter.replace(/^@/, "")}` },
    profile.instagram && { href: `https://instagram.com/${profile.instagram.replace(/^@/, "")}`, label: "Instagram", text: `@${profile.instagram.replace(/^@/, "")}` },
    profile.youtube && { href: profile.youtube.startsWith("http") ? profile.youtube : `https://youtube.com/@${profile.youtube.replace(/^@/, "")}`, label: "YouTube", text: profile.youtube },
    profile.tiktok && { href: `https://tiktok.com/@${profile.tiktok.replace(/^@/, "")}`, label: "TikTok", text: `@${profile.tiktok.replace(/^@/, "")}` },
  ].filter(Boolean) as { href: string; label: string; text: string }[]

  return (
    <div className="flex flex-col items-center text-center py-16 px-4 gap-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg ring-4 ring-background">
          <span className="text-2xl font-bold text-primary-foreground">{initials}</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 ring-2 ring-background" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">
          {profile.full_name || profile.username}
        </h1>
        <div className="flex items-center justify-center gap-2">
          <p className="text-muted-foreground text-lg">@{profile.username}</p>
          <button
            type="button"
            onClick={copyProfileUrl}
            aria-label="Copy profile link"
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Link className="w-3.5 h-3.5" />}
          </button>
        </div>
        {memberSince && (
          <p className="text-sm text-muted-foreground">{memberSince}</p>
        )}
        {profile.bio && (
          <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{profile.bio}</p>
        )}
        {socialLinks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-1">
            {socialLinks.map((link) => (
              <SocialLink key={link.label} href={link.href} label={link.label}>
                {link.text}
              </SocialLink>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center divide-x divide-border rounded-xl border bg-card shadow-sm overflow-hidden">
        {STATS.map(({ key, label }) => (
          <AnimatedStat key={key} value={profile.stats[key]} label={label} />
        ))}
      </div>

      {profile.stats.tasks_total > 0 && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Work completed</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
