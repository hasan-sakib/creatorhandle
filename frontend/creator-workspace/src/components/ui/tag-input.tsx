import { X } from "lucide-react"
import { useId, useRef, useState, type KeyboardEvent } from "react"

import { cn } from "@/lib/utils"

interface TagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  /** Maximum number of items. */
  max: number
  /** Maximum length of a single item. */
  maxLength?: number
  /** Accessible name for the text box. */
  label: string
  placeholder?: string
  /** One-click suggestions that are not selected yet. */
  suggestions?: string[]
  className?: string
}

/**
 * Chip input for short lists (niches, formats, tags).
 * Enter or comma adds; pasting "a, b, c" adds three; Backspace on an empty box
 * removes the last chip. Changes are announced to screen readers.
 */
export function TagInput({
  value,
  onChange,
  max,
  maxLength = 30,
  label,
  placeholder,
  suggestions = [],
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState("")
  const [announcement, setAnnouncement] = useState("")
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const messageId = useId()

  const has = (list: string[], item: string) =>
    list.some((t) => t.toLowerCase() === item.toLowerCase())

  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length === 0) return

    const next = [...value]
    const added: string[] = []
    let problem = ""
    for (const part of parts) {
      if (part.length > maxLength) {
        problem = `Each item can be at most ${maxLength} characters.`
        continue
      }
      if (has(next, part)) continue
      if (next.length >= max) {
        problem = `You can add up to ${max} items.`
        break
      }
      next.push(part)
      added.push(part)
    }
    setError(problem)
    if (added.length > 0) {
      onChange(next)
      setAnnouncement(`Added ${added.join(", ")}`)
    }
    setDraft("")
  }

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
    setError("")
    setAnnouncement(`Removed ${tag}`)
    inputRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault() // do not submit the surrounding form
      add(draft)
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      remove(value[value.length - 1])
    }
  }

  const available = suggestions.filter((s) => !has(value, s))
  const atMax = value.length >= max

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pl-2.5 pr-1 text-xs font-medium text-primary"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={(e) => {
                e.stopPropagation()
                remove(tag)
              }}
              className="grid size-4 place-items-center rounded-full hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={draft}
          aria-label={label}
          aria-describedby={error ? messageId : undefined}
          aria-invalid={error ? true : undefined}
          disabled={atMax && draft === ""}
          placeholder={atMax ? `Maximum of ${max} reached` : value.length === 0 ? placeholder : ""}
          onChange={(e) => {
            const next = e.target.value
            if (next.includes(",")) add(next)
            else setDraft(next)
          }}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex items-start justify-between gap-3 text-xs">
        <p id={messageId} className={cn("min-h-4 text-destructive", !error && "sr-only")}>
          {error}
        </p>
        <p className="shrink-0 text-muted-foreground" aria-hidden="true">
          {value.length}/{max}
        </p>
      </div>

      {available.length > 0 && !atMax && (
        <div className="flex flex-wrap gap-1.5" aria-label={`${label} suggestions`} role="group">
          {available.map((s) => (
            <button
              key={s}
              type="button"
              aria-label={`Add ${s}`}
              onClick={() => add(s)}
              className="rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
