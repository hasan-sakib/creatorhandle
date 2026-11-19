/**
 * Portfolio theme keys, names and default accents. Single source for both
 * frontends; the backend keeps the allowed keys in ThemeKey
 * (backend/app/domain/validators.py). Theme CSS lives in
 * creator-site/src/styles/creator-themes.css.
 */
import type { AccentKey } from "./accents.ts"

export type ThemeKey =
  | "studio"
  | "editorial"
  | "aurora"
  | "bold"
  | "soft"
  | "mono"

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
