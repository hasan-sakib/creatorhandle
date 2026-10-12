import { Globe, Instagram, Music2, Twitter, Youtube } from "lucide-react"
import type { ComponentType } from "react"

import type { PublicCreator } from "@/client"
import { safeHttpUrl } from "@/lib/safeUrl"

export interface SocialLink {
  key: string
  label: string
  href: string
  /** Short text to show, e.g. "@alex" or "alex.com". */
  text: string
  Icon: ComponentType<{ className?: string }>
}

// Handles are interpolated into a URL path, so only allow plain handle characters.
const HANDLE = /^[A-Za-z0-9._-]{1,100}$/

function fromHandle(
  value: string | null | undefined,
  base: string,
): { href: string; text: string } | null {
  const v = (value ?? "").trim()
  if (!v) return null
  if (/^https?:\/\//i.test(v)) {
    const href = safeHttpUrl(v)
    return href ? { href, text: new URL(href).host + new URL(href).pathname.replace(/\/$/, "") } : null
  }
  const handle = v.replace(/^@/, "")
  return HANDLE.test(handle) ? { href: `${base}${handle}`, text: `@${handle}` } : null
}

export function getSocialLinks(p: PublicCreator): SocialLink[] {
  const out: SocialLink[] = []
  const add = (
    key: string,
    label: string,
    Icon: SocialLink["Icon"],
    found: { href: string; text: string } | null,
  ) => {
    if (found) out.push({ key, label, Icon, ...found })
  }

  const web = safeHttpUrl(p.website)
  add("website", "Website", Globe, web ? { href: web, text: new URL(web).host } : null)
  add("youtube", "YouTube", Youtube, fromHandle(p.youtube, "https://youtube.com/@"))
  add("instagram", "Instagram", Instagram, fromHandle(p.instagram, "https://instagram.com/"))
  add("tiktok", "TikTok", Music2, fromHandle(p.tiktok, "https://tiktok.com/@"))
  add("twitter", "X / Twitter", Twitter, fromHandle(p.twitter, "https://x.com/"))
  return out
}
