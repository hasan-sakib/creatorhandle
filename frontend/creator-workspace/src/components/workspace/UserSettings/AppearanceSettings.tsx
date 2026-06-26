import { Check } from "lucide-react"

import {
  ACCENT_PRESETS,
  type AccentKey,
  useAccentColor,
} from "@/components/accent-color-provider"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export default function AppearanceSettings() {
  const { accent, setAccent } = useAccentColor()
  const { resolvedTheme } = useTheme()

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Accent Color */}
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-1">Accent Color</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose an accent color for buttons, links, and interactive elements.
        </p>

        <div className="grid grid-cols-5 gap-4">
          {(Object.entries(ACCENT_PRESETS) as [AccentKey, typeof ACCENT_PRESETS[AccentKey]][]).map(
            ([key, preset]) => {
              const isSelected = accent === key
              const solidColor = preset[resolvedTheme]
              const gradientBg = "gradient" in preset ? preset.gradient : undefined

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAccent(key)}
                  className="flex flex-col items-center gap-2 group"
                  aria-label={`Select ${preset.label} accent color`}
                  aria-pressed={isSelected}
                >
                  <span
                    className={cn(
                      "relative w-10 h-10 rounded-full transition-all duration-150",
                      "ring-2 ring-offset-2 ring-offset-background",
                      isSelected
                        ? "ring-foreground scale-110"
                        : "ring-transparent group-hover:ring-muted-foreground/40 group-hover:scale-105"
                    )}
                    style={{
                      background: gradientBg ?? solidColor,
                    }}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow-sm" strokeWidth={2.5} />
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors",
                      isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {preset.label}
                  </span>
                </button>
              )
            }
          )}
        </div>
      </section>

      {/* Theme Mode info */}
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-1">Theme Mode</h2>
        <p className="text-sm text-muted-foreground">
          Switch between light and dark mode using the toggle in the sidebar footer.
          Your accent color automatically adapts to the active theme.
        </p>
      </section>
    </div>
  )
}
