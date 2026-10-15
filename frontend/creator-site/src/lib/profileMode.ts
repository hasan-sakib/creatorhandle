/**
 * Light/dark mode of a creator's page.
 *
 * Precedence: the visitor's own choice (the toggle in the page's navbar), then
 * the creator's default (their "color mode" setting), then the visitor's
 * device. The visitor's choice has its own storage key on purpose: the
 * dashboard stores its theme under "vite-ui-theme", and a creator who uses
 * dark mode in the dashboard must not silently override how every other
 * creator's page looks.
 */
import { getStoredTheme, isDark, setTheme as setSiteTheme } from "@/lib/theme"

export type Mode = "light" | "dark"

const VISITOR_KEY = "ch-profile-mode"
const lookKey = (username: string) => `ch-profile-look:${username}`

export function getVisitorMode(): Mode | null {
  try {
    const v = localStorage.getItem(VISITOR_KEY)
    return v === "light" || v === "dark" ? v : null
  } catch {
    return null
  }
}

export function setVisitorMode(mode: Mode): void {
  try {
    localStorage.setItem(VISITOR_KEY, mode)
  } catch {
    // storage unavailable: the choice still applies for this page view
  }
}

/** The mode to show: visitor's choice, else the creator's default, else the device. */
export function resolveMode(creatorMode: string | null | undefined): Mode {
  const visitor = getVisitorMode()
  if (visitor) return visitor
  if (creatorMode === "light" || creatorMode === "dark") return creatorMode
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

/** Sets the `dark`/`light` class on <html> (Tailwind's dark variant keys off it). */
export function applyMode(mode: Mode): void {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(mode)
  root.style.colorScheme = mode
}

/** Puts back the site-wide theme (landing page / dashboard choice). */
export function restoreSiteMode(): void {
  document.documentElement.style.colorScheme = ""
  setSiteTheme(getStoredTheme())
}

export const currentModeIsDark = (): boolean => document.documentElement.classList.contains("dark") || (!document.documentElement.classList.contains("light") && isDark())

/**
 * Remember the creator's default mode per username so the next visit can set
 * the right background before the page is fetched (see index.html), which
 * avoids a light flash on a dark page.
 */
export function rememberLook(username: string, creatorMode: string | null | undefined): void {
  try {
    localStorage.setItem(lookKey(username), JSON.stringify({ mode: creatorMode ?? null }))
  } catch {
    // ignore
  }
}
