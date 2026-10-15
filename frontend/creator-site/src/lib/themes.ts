/**
 * Portfolio themes. A theme only changes how the page looks (colors, fonts,
 * corners, surfaces, background effect); the page structure is identical for
 * every creator. The CSS for each theme lives in styles/creator-themes.css.
 *
 * Keep the keys in sync with ThemeKey in backend/app/core/validators.py and
 * with creator-workspace/src/lib/themePresets.ts.
 */
import { useEffect, useState } from "react"

import type { AccentKey } from "@/lib/accent"

export type ThemeKey = "studio" | "editorial" | "aurora" | "bold" | "soft" | "mono"

export interface ThemeDef {
  label: string
  /** Accent used when the creator has not chosen one. */
  defaultAccent: AccentKey
}

export const THEMES: Record<ThemeKey, ThemeDef> = {
  studio: { label: "Studio", defaultAccent: "teal" },
  editorial: { label: "Editorial", defaultAccent: "rose" },
  aurora: { label: "Aurora", defaultAccent: "violet" },
  bold: { label: "Bold", defaultAccent: "orange" },
  soft: { label: "Soft", defaultAccent: "sky" },
  mono: { label: "Mono", defaultAccent: "green" },
}

export const DEFAULT_THEME: ThemeKey = "studio"

/** Unknown or missing values fall back to the default theme. */
export function resolveTheme(key: string | null | undefined): ThemeKey {
  return key && key in THEMES ? (key as ThemeKey) : DEFAULT_THEME
}

/**
 * Each theme (except studio, whose fonts ship with the app) has its own display
 * font. It is loaded only when that theme is used; Vite splits each import
 * into its own chunk, so a visitor downloads at most one extra font.
 */
const FONT_LOADERS: Partial<Record<ThemeKey, () => Promise<unknown>>> = {
  editorial: () => import("@fontsource-variable/fraunces/wght.css"),
  aurora: () => import("@fontsource-variable/space-grotesk/wght.css"),
  bold: () => import("@fontsource-variable/archivo/wght.css"),
  soft: () => import("@fontsource-variable/nunito/wght.css"),
  mono: () => import("@fontsource-variable/jetbrains-mono/wght.css"),
}

/** Never let a slow or failing font block the page: show it after this long. */
const FONT_TIMEOUT_MS = 800

/**
 * True once the theme's font is ready (or failed, or took too long). The page
 * waits for this before it is revealed, so the font does not visibly swap.
 */
export function useThemeFont(theme: string | null | undefined, enabled = true): boolean {
  const key = resolveTheme(theme)
  const [readyFor, setReadyFor] = useState<ThemeKey | null>(null)

  useEffect(() => {
    if (!enabled) return
    const load = FONT_LOADERS[key]
    if (!load) {
      setReadyFor(key)
      return
    }
    let cancelled = false
    const done = () => !cancelled && setReadyFor(key)
    const timer = window.setTimeout(done, FONT_TIMEOUT_MS)
    load()
      .catch(() => undefined)
      .finally(() => {
        window.clearTimeout(timer)
        done()
      })
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [key, enabled])

  return !enabled || readyFor === key
}
