import { z } from "zod"

/**
 * Shared rules for the public portfolio fields. These mirror the backend
 * (backend/app/core/validators.py), which is the real gate.
 */

export const PLATFORMS = [
  "YouTube",
  "TikTok",
  "Instagram",
  "Twitch",
  "X",
  "LinkedIn",
  "Podcast",
  "Blog",
  "Other",
] as const

export const AVAILABILITY_OPTIONS = [
  { value: "open", label: "Open to collaborations", hint: "Shows a green badge" },
  { value: "limited", label: "Limited availability", hint: "Shows an amber badge" },
  { value: "closed", label: "Not taking new work", hint: "Shows a grey badge" },
] as const

export const NICHE_SUGGESTIONS = [
  "Tech",
  "Beauty",
  "Fashion",
  "Food",
  "Gaming",
  "Travel",
  "Fitness",
  "Education",
  "Lifestyle",
  "Finance",
]

export const FORMAT_SUGGESTIONS = [
  "Long videos",
  "Shorts",
  "Reels",
  "Livestreams",
  "Podcasts",
  "Blog posts",
  "Photography",
  "Newsletters",
]

/** http(s) only. A bare "example.com/path" is accepted; the backend adds https://. */
export function isHttpUrl(value: string): boolean {
  const v = value.trim()
  if (!v || /\s/.test(v)) return false
  if (!v.includes("://") && (v.includes(":") || v.startsWith("/"))) return false
  try {
    const url = new URL(v.includes("://") ? v : `https://${v}`)
    return (url.protocol === "http:" || url.protocol === "https:") && !!url.hostname
  } catch {
    return false
  }
}

export const urlField = z
  .string()
  .max(2048, "Link is too long")
  .refine((v) => v.trim() === "" || isHttpUrl(v), {
    message: "Enter a valid http(s) link",
  })

/** An image we host: /media/images/<owner>/<id>.webp (returned by the upload endpoint). */
export const isMediaPath = (value: string): boolean =>
  /^\/media\/images\/[0-9a-f]{16}\/[0-9a-f]{32}\.webp$/.test(value.trim())

/** An uploaded image or an http(s) link. */
export const imageField = z
  .string()
  .max(2048, "Link is too long")
  .refine((v) => v.trim() === "" || isMediaPath(v) || isHttpUrl(v), {
    message: "Enter a valid http(s) link or upload an image",
  })

export const tagArray = (max: number, maxLength = 30) =>
  z
    .array(z.string().max(maxLength, `Each item can be at most ${maxLength} characters`))
    .max(max, `Up to ${max} items`)

/** "" -> null, otherwise trimmed. */
export const blankToNull = (value: string | null | undefined): string | null => {
  const v = (value ?? "").trim()
  return v === "" ? null : v
}

export const sameList = (a: readonly unknown[] | null | undefined, b: readonly unknown[] | null | undefined) =>
  JSON.stringify(a ?? []) === JSON.stringify(b ?? [])
