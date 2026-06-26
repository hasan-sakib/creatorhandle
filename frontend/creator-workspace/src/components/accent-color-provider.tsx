import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

import { useTheme } from "@/components/theme-provider"

const ACCENT_KEY = "vite-ui-accent"

export const ACCENT_PRESETS = {
  teal: {
    label: "Teal",
    light: "oklch(0.5982 0.10687 182.4689)",
    dark: "oklch(0.65 0.10687 182.4689)",
  },
  indigo: {
    label: "Indigo",
    light: "oklch(0.585 0.148 261)",
    dark: "oklch(0.655 0.148 261)",
  },
  violet: {
    label: "Violet",
    light: "oklch(0.585 0.155 290)",
    dark: "oklch(0.655 0.155 290)",
  },
  rose: {
    label: "Rose",
    light: "oklch(0.595 0.165 10)",
    dark: "oklch(0.655 0.165 10)",
  },
  orange: {
    label: "Orange",
    light: "oklch(0.655 0.155 51)",
    dark: "oklch(0.705 0.155 51)",
  },
  green: {
    label: "Green",
    light: "oklch(0.575 0.140 150)",
    dark: "oklch(0.645 0.140 150)",
  },
  sky: {
    label: "Sky",
    light: "oklch(0.585 0.126 220)",
    dark: "oklch(0.655 0.126 220)",
  },
  slate: {
    label: "Slate",
    light: "oklch(0.485 0.024 255)",
    dark: "oklch(0.595 0.024 255)",
  },
  sunset: {
    label: "Sunset",
    light: "oklch(0.615 0.158 28)",
    dark: "oklch(0.665 0.158 28)",
    gradient: "linear-gradient(135deg, #f97316, #ec4899)",
  },
  aurora: {
    label: "Aurora",
    light: "oklch(0.590 0.148 289)",
    dark: "oklch(0.650 0.148 289)",
    gradient: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
  },
} as const

export type AccentKey = keyof typeof ACCENT_PRESETS

type AccentColorContextType = {
  accent: AccentKey
  setAccent: (key: AccentKey) => void
  presets: typeof ACCENT_PRESETS
}

const AccentColorContext = createContext<AccentColorContextType | undefined>(undefined)

function applyAccent(key: AccentKey, resolvedTheme: "dark" | "light") {
  const preset = ACCENT_PRESETS[key]
  const value = preset[resolvedTheme]
  const root = window.document.documentElement
  root.style.setProperty("--primary", value)
  root.style.setProperty("--sidebar-primary", value)
  root.style.setProperty("--ring", value)
}

export function AccentColorProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()

  const [accent, setAccentState] = useState<AccentKey>(
    () => (localStorage.getItem(ACCENT_KEY) as AccentKey | null) ?? "teal"
  )

  useEffect(() => {
    applyAccent(accent, resolvedTheme)
  }, [accent, resolvedTheme])

  const setAccent = useCallback((key: AccentKey) => {
    localStorage.setItem(ACCENT_KEY, key)
    setAccentState(key)
  }, [])

  return (
    <AccentColorContext.Provider value={{ accent, setAccent, presets: ACCENT_PRESETS }}>
      {children}
    </AccentColorContext.Provider>
  )
}

export function useAccentColor() {
  const context = useContext(AccentColorContext)
  if (!context) throw new Error("useAccentColor must be used within AccentColorProvider")
  return context
}
