import type { PublicCreator } from "@/client"

/**
 * The page is one fixed template: every creator has these sections, in this
 * order, with the same navbar. Only the content (and theme) differ.
 */
export const NAV_SECTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "approach", label: "Approach" },
  { id: "services", label: "Services" },
  { id: "work", label: "Work" },
  { id: "brands", label: "Brands" },
  { id: "contact", label: "Contact" },
] as const

/** Anchors from older versions of the page. */
export const LEGACY_HASHES: Record<string, string> = { create: "about" }

/** "Alex Rivera" -> "Alex"; falls back to the @handle. */
export function firstName(
  p: Pick<PublicCreator, "full_name" | "username">,
): string {
  const first = (p.full_name ?? "").trim().split(/\s+/)[0]
  return first || `@${p.username}`
}
