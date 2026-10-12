/**
 * Accent presets creators can pick for their page. Keep in sync with
 * ACCENT_PRESETS in creator-workspace/src/components/accent-color-provider.tsx
 * (and AccentKey in backend/app/core/validators.py).
 */
export const ACCENTS = {
  teal: { light: "oklch(0.5982 0.10687 182.4689)", dark: "oklch(0.65 0.10687 182.4689)" },
  indigo: { light: "oklch(0.585 0.148 261)", dark: "oklch(0.655 0.148 261)" },
  violet: { light: "oklch(0.585 0.155 290)", dark: "oklch(0.655 0.155 290)" },
  rose: { light: "oklch(0.595 0.165 10)", dark: "oklch(0.655 0.165 10)" },
  orange: { light: "oklch(0.655 0.155 51)", dark: "oklch(0.705 0.155 51)" },
  green: { light: "oklch(0.575 0.14 150)", dark: "oklch(0.645 0.14 150)" },
  sky: { light: "oklch(0.585 0.126 220)", dark: "oklch(0.655 0.126 220)" },
  slate: { light: "oklch(0.485 0.024 255)", dark: "oklch(0.595 0.024 255)" },
  sunset: { light: "oklch(0.615 0.158 28)", dark: "oklch(0.665 0.158 28)" },
  aurora: { light: "oklch(0.59 0.148 289)", dark: "oklch(0.65 0.148 289)" },
} as const

export type AccentKey = keyof typeof ACCENTS

export function resolveAccent(key: string | null | undefined): AccentKey {
  return key && key in ACCENTS ? (key as AccentKey) : "teal"
}
