/**
 * Everything user-supplied that ends up in an href or src goes through here.
 * Only absolute http(s) URLs are allowed; javascript:, data:, etc. become null.
 * (The backend validates too; this is defence in depth for legacy rows.)
 */
export function safeHttpUrl(value: string | null | undefined): string | null {
  const v = (value ?? "").trim()
  if (!v || /\s/.test(v)) return null
  try {
    const url = new URL(v)
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      !url.hostname
    )
      return null
    return url.toString()
  } catch {
    return null
  }
}

/**
 * An image URL: an absolute http(s) URL, or one of our own uploaded images
 * (a site-relative /media/images/<owner>/<id>.webp path served by Caddy).
 */
export function safeImageUrl(value: string | null | undefined): string | null {
  const v = (value ?? "").trim()
  if (/^\/media\/images\/[0-9a-f]{16}\/[0-9a-f]{32}\.webp$/.test(v)) return v
  return safeHttpUrl(v)
}

/** A plain address with exactly one "@" and no characters that could alter the mailto: URL. */
export function safeEmail(value: string | null | undefined): string | null {
  const v = (value ?? "").trim()
  return /^[^\s@?&,;<>"']+@[^\s@?&,;<>"']+\.[^\s@?&,;<>"']+$/.test(v) ? v : null
}
