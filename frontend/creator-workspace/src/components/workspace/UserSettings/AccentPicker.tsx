import { type KeyboardEvent, useRef } from "react"
import { cn } from "@/lib/utils"
import {
  ACCENT_PRESETS,
  type AccentKey,
} from "@/providers/accent-color-provider"

interface AccentPickerProps {
  /** null = "Match theme" (use the theme's default accent). */
  value: AccentKey | null
  onChange: (key: AccentKey | null) => void
  label: string
  /** When set, a first "Match theme" option is shown; this is the accent it resolves to. */
  matchTheme?: AccentKey
}

const KEYS = Object.keys(ACCENT_PRESETS) as AccentKey[]

/** Radio group of colour swatches with arrow-key navigation. */
export function AccentPicker({
  value,
  onChange,
  label,
  matchTheme,
}: AccentPickerProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const options: (AccentKey | null)[] = matchTheme ? [null, ...KEYS] : [...KEYS]
  const idOf = (o: AccentKey | null) => o ?? "__auto__"

  const move = (from: AccentKey | null, delta: number) => {
    const next =
      options[(options.indexOf(from) + delta + options.length) % options.length]
    onChange(next)
    refs.current[idOf(next)]?.focus()
  }

  const onKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    key: AccentKey | null,
  ) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault()
      move(key, 1)
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault()
      move(key, -1)
    }
  }

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-3">
      {options.map((key) => {
        const resolved = key ?? (matchTheme as AccentKey)
        const preset = ACCENT_PRESETS[resolved]
        const selected = key === value
        const background = "gradient" in preset ? preset.gradient : preset.light
        const auto = key === null
        return (
          <button
            key={idOf(key)}
            ref={(el) => {
              refs.current[idOf(key)] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={auto ? `Match theme (${preset.label})` : preset.label}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(key)}
            onKeyDown={(e) => onKeyDown(e, key)}
            className={cn(
              "relative grid size-9 place-items-center rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected && "ring-2 ring-foreground",
            )}
            style={{ background }}
            title={auto ? `Match theme (${preset.label})` : preset.label}
          >
            {auto && (
              <span className="rounded-full bg-background/90 px-1 text-[9px] font-bold leading-4 text-foreground">
                AUTO
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
