import { ACCENT_PRESETS, type AccentKey } from "@creatorhandle/shared/accents"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

import { useTheme } from "@/providers/theme-provider"

const ACCENT_KEY = "vite-ui-accent"

export { ACCENT_PRESETS }
export type { AccentKey }

type AccentColorContextType = {
  accent: AccentKey
  setAccent: (key: AccentKey) => void
  presets: typeof ACCENT_PRESETS
}

const AccentColorContext = createContext<AccentColorContextType | undefined>(
  undefined,
)

function applyAccent(key: AccentKey, resolvedTheme: "dark" | "light") {
  const preset = ACCENT_PRESETS[key]
  const root = window.document.documentElement
  // Light mode: darken slightly so white text on filled buttons and the accent
  // used as text both stay readable (>= 4.5:1). Dark mode: lighter accent, dark text.
  const value =
    resolvedTheme === "light"
      ? `color-mix(in oklch, ${preset.light} 85%, black)`
      : preset.dark
  root.style.setProperty("--primary", value)
  root.style.setProperty("--ring", value)
  root.style.setProperty(
    "--primary-foreground",
    resolvedTheme === "light" ? "oklch(0.985 0 0)" : "oklch(0.18 0.01 250)",
  )
}

export function AccentColorProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { resolvedTheme } = useTheme()

  const [accent, setAccentState] = useState<AccentKey>(
    () => (localStorage.getItem(ACCENT_KEY) as AccentKey | null) ?? "teal",
  )

  useEffect(() => {
    applyAccent(accent, resolvedTheme)
  }, [accent, resolvedTheme])

  const setAccent = useCallback((key: AccentKey) => {
    localStorage.setItem(ACCENT_KEY, key)
    setAccentState(key)
  }, [])

  return (
    <AccentColorContext.Provider
      value={{ accent, setAccent, presets: ACCENT_PRESETS }}
    >
      {children}
    </AccentColorContext.Provider>
  )
}

export function useAccentColor() {
  const context = useContext(AccentColorContext)
  if (!context)
    throw new Error("useAccentColor must be used within AccentColorProvider")
  return context
}
