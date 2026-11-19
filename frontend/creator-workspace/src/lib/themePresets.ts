/**
 * Portfolio themes as shown in the dashboard's theme picker (small swatch
 * previews). The real CSS lives in creator-site/src/styles/creator-themes.css;
 * these values are approximations just for the preview. Keep the keys in sync
 * with ThemeKey in backend/app/domain/validators.py and
 * creator-site/src/lib/themes.ts.
 */
import {
  DEFAULT_THEME,
  THEMES,
  type ThemeKey,
} from "@creatorhandle/shared/themes"

import type { AccentKey } from "@/providers/accent-color-provider"

export { DEFAULT_THEME }
export type { ThemeKey }

export interface Palette {
  bg: string
  card: string
  fg: string
  border: string
}

export interface ThemePreset {
  label: string
  blurb: string
  /** Accent used on the page when the creator has not picked one. */
  defaultAccent: AccentKey
  /** Generic font family hint, so the dashboard does not bundle the theme fonts. */
  fontFamily: string
  fontWeight: number
  radius: number
  cardBorder: string
  cardShadow: string
  light: Palette
  dark: Palette
}

export const THEME_PRESETS: Record<ThemeKey, ThemePreset> = {
  studio: {
    ...THEMES.studio,
    blurb: "Clean and glassy, with a soft glow",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    fontWeight: 700,
    radius: 10,
    cardBorder: "1px solid",
    cardShadow: "0 6px 18px -8px rgba(0,0,0,.25)",
    light: { bg: "#ffffff", card: "#ffffff", fg: "#171717", border: "#e5e5e5" },
    dark: { bg: "#0a0a0a", card: "#171717", fg: "#fafafa", border: "#2a2a2a" },
  },
  editorial: {
    ...THEMES.editorial,
    blurb: "Magazine style: paper, ink and serif type",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontWeight: 600,
    radius: 2,
    cardBorder: "1px solid",
    cardShadow: "none",
    light: { bg: "#f7f2e8", card: "#fbf8f1", fg: "#2b2218", border: "#d8cdb8" },
    dark: { bg: "#1d1914", card: "#26211a", fg: "#f1eadc", border: "#3a332a" },
  },
  aurora: {
    ...THEMES.aurora,
    blurb: "Glowing, with deep indigo in dark mode",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    fontWeight: 700,
    radius: 12,
    cardBorder: "1px solid",
    cardShadow: "0 10px 26px -10px rgba(139,92,246,.55)",
    light: { bg: "#f5f3ff", card: "#fbfaff", fg: "#1f1b3a", border: "#ddd6fe" },
    dark: { bg: "#100c26", card: "#1a1438", fg: "#f3f0ff", border: "#3b2f73" },
  },
  bold: {
    ...THEMES.bold,
    blurb: "Heavy borders, hard shadows, flat colour",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    fontWeight: 800,
    radius: 3,
    cardBorder: "2px solid",
    cardShadow: "3px 3px 0 currentColor",
    light: { bg: "#fdf6c8", card: "#ffffff", fg: "#111111", border: "#111111" },
    dark: { bg: "#14141a", card: "#1d1d25", fg: "#f5f5f5", border: "#f5f5f5" },
  },
  soft: {
    ...THEMES.soft,
    blurb: "Friendly pastel surfaces and round corners",
    fontFamily: "ui-rounded, 'Nunito', system-ui, sans-serif",
    fontWeight: 800,
    radius: 16,
    cardBorder: "0 solid",
    cardShadow: "0 12px 28px -14px rgba(14,165,233,.5)",
    light: { bg: "#eef7fb", card: "#f8fcfe", fg: "#252a3d", border: "#cfe6f1" },
    dark: { bg: "#1b2630", card: "#22303b", fg: "#eef4f8", border: "#34505f" },
  },
  mono: {
    ...THEMES.mono,
    blurb: "Technical: monospace type on grid paper",
    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
    fontWeight: 700,
    radius: 1,
    cardBorder: "1px solid",
    cardShadow: "none",
    light: { bg: "#fafbfc", card: "#ffffff", fg: "#1c2026", border: "#ccd1d6" },
    dark: { bg: "#0c0f13", card: "#12161b", fg: "#e8eaed", border: "#2a3038" },
  },
}

export const THEME_KEYS = Object.keys(THEME_PRESETS) as ThemeKey[]

export type ColorMode = "system" | "light" | "dark"

export const COLOR_MODE_OPTIONS: {
  value: ColorMode
  label: string
  hint: string
}[] = [
  {
    value: "system",
    label: "Visitor's device",
    hint: "Follows each visitor's light or dark setting",
  },
  { value: "light", label: "Light", hint: "Starts light" },
  { value: "dark", label: "Dark", hint: "Starts dark" },
]
