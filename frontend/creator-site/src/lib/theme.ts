/**
 * Theme handling shared with the dashboard (/app): both apps run on one origin
 * and use the same storage key and values, so a choice made here carries over.
 * index.html applies the stored theme before first paint to avoid a flash.
 */
export type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "vite-ui-theme"

export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark" || stored === "system")
      return stored
  } catch {
    // storage unavailable (private mode, blocked): fall back to the system theme
  }
  return "system"
}

export function isDark(theme: Theme = getStoredTheme()): boolean {
  if (theme === "system")
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  return theme === "dark"
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignore: the class below still applies for this page view
  }
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(isDark(theme) ? "dark" : "light")
}
