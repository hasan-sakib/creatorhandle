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
    if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname) return null
    return url.toString()
  } catch {
    return null
  }
}

/** A plain address with exactly one "@" and no characters that could alter the mailto: URL. */
export function safeEmail(value: string | null | undefined): string | null {
  const v = (value ?? "").trim()
  return /^[^\s@?&,;<>"']+@[^\s@?&,;<>"']+\.[^\s@?&,;<>"']+$/.test(v) ? v : null
}
