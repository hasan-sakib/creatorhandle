import { type KeyboardEvent, useRef } from "react"

import { ACCENT_PRESETS, type AccentKey } from "@/components/accent-color-provider"
import { cn } from "@/lib/utils"

interface AccentPickerProps {
  value: AccentKey
  onChange: (key: AccentKey) => void
  label: string
}

const KEYS = Object.keys(ACCENT_PRESETS) as AccentKey[]

/** Radio group of colour swatches with arrow-key navigation. */
export function AccentPicker({ value, onChange, label }: AccentPickerProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  const move = (from: AccentKey, delta: number) => {
    const next = KEYS[(KEYS.indexOf(from) + delta + KEYS.length) % KEYS.length]
    onChange(next)
    refs.current[next]?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, key: AccentKey) => {
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
      {KEYS.map((key) => {
        const preset = ACCENT_PRESETS[key]
        const selected = key === value
        const background = "gradient" in preset ? preset.gradient : preset.light
        return (
          <button
            key={key}
            ref={(el) => {
              refs.current[key] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={preset.label}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(key)}
            onKeyDown={(e) => onKeyDown(e, key)}
            className={cn(
              "size-9 rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected && "ring-2 ring-foreground",
            )}
            style={{ background }}
            title={preset.label}
          />
        )
      })}
    </div>
  )
}
