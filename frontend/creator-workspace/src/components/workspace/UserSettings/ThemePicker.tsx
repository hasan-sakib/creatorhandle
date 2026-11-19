import { type KeyboardEvent, useRef } from "react"
import {
  COLOR_MODE_OPTIONS,
  type ColorMode,
  THEME_KEYS,
  THEME_PRESETS,
  type ThemeKey,
} from "@/lib/themePresets"
import { cn } from "@/lib/utils"
import {
  ACCENT_PRESETS,
  type AccentKey,
} from "@/providers/accent-color-provider"
import { useTheme } from "@/providers/theme-provider"

interface ThemePickerProps {
  value: ThemeKey
  onChange: (key: ThemeKey) => void
  /** The accent the page will use (the creator's choice, or the theme's default). */
  accent: AccentKey
  mode: ColorMode
  label: string
}

/** A tiny, static mock of one theme: nav bar, a card with a heading and a button. */
function ThemeSwatch({
  theme,
  accent,
  dark,
}: {
  theme: ThemeKey
  accent: AccentKey
  dark: boolean
}) {
  const p = THEME_PRESETS[theme]
  const c = dark ? p.dark : p.light
  const accentColor = ACCENT_PRESETS[accent].light
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden p-2.5"
      style={{ background: c.bg, color: c.fg, borderRadius: 6 }}
    >
      <div
        className="mb-2 h-3.5 w-full"
        style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: Math.min(p.radius, 8),
        }}
      />
      <div
        className="p-2.5"
        style={{
          background: c.card,
          border: `${p.cardBorder} ${c.border}`,
          borderRadius: p.radius,
          boxShadow: p.cardShadow,
        }}
      >
        <p
          className="text-lg leading-none"
          style={{
            fontFamily: p.fontFamily,
            fontWeight: p.fontWeight,
            letterSpacing: "-0.02em",
          }}
        >
          Aa
        </p>
        <div
          className="mt-2 h-1 w-4/5 rounded-full opacity-25"
          style={{ background: c.fg }}
        />
        <div
          className="mt-1 h-1 w-3/5 rounded-full opacity-25"
          style={{ background: c.fg }}
        />
        <div
          className="mt-2.5 h-3 w-10"
          style={{
            background: accentColor,
            borderRadius:
              Math.min(p.radius, 999) > 8 ? 999 : Math.max(p.radius, 1),
          }}
        />
      </div>
    </div>
  )
}

/** Radio group of theme preview cards (arrow keys move the selection). */
export function ThemePicker({
  value,
  onChange,
  accent,
  mode,
  label,
}: ThemePickerProps) {
  const { resolvedTheme } = useTheme()
  const dark =
    mode === "dark" || (mode === "system" && resolvedTheme === "dark")
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  const move = (from: ThemeKey, delta: number) => {
    const next =
      THEME_KEYS[
        (THEME_KEYS.indexOf(from) + delta + THEME_KEYS.length) %
          THEME_KEYS.length
      ]
    onChange(next)
    refs.current[next]?.focus()
  }
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, key: ThemeKey) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault()
      move(key, 1)
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault()
      move(key, -1)
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      {THEME_KEYS.map((key) => {
        const p = THEME_PRESETS[key]
        const selected = key === value
        return (
          <button
            key={key}
            ref={(el) => {
              refs.current[key] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(key)}
            onKeyDown={(e) => onKeyDown(e, key)}
            className={cn(
              "rounded-lg border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "border-primary ring-1 ring-primary"
                : "hover:border-primary/50",
            )}
          >
            <ThemeSwatch theme={key} accent={accent} dark={dark} />
            <span className="mt-2 block text-sm font-medium">{p.label}</span>
            <span className="block text-xs text-muted-foreground">
              {p.blurb}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** 3-way segmented control for the page's default light/dark mode. */
export function ColorModeControl({
  value,
  onChange,
  label,
}: {
  value: ColorMode
  onChange: (mode: ColorMode) => void
  label: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-lg border p-0.5"
    >
      {COLOR_MODE_OPTIONS.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              on
                ? "bg-primary/12 font-medium text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
