import { Menu, Moon, Sun, X } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { SafeImage } from "@/components/creator/SafeImage"
import { useActiveSection } from "@/hooks/useActiveSection"
import { applyMode, currentModeIsDark, setVisitorMode } from "@/lib/profileMode"
import { cn } from "@/lib/utils"

export interface NavSection {
  id: string
  label: string
}

interface GlassNavbarProps {
  name: string
  avatarUrl?: string | null
  sections: NavSection[]
  /** Label and target of the call-to-action button (always shown, same for everyone). */
  cta: { label: string; id: string }
}

/** Scrolls to a section and updates the hash without re-mounting the router. */
export function goToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: "smooth", block: "start" })
  history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`)
}

export function GlassNavbar({ name, avatarUrl, sections, cta }: GlassNavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const active = useActiveSection(sections.map((s) => s.id))

  useEffect(() => setDark(currentModeIsDark()), [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const initials = name
    .replace(/^@/, "")
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const onNavigate = (id: string) => {
    setOpen(false)
    goToSection(id)
  }

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    const mode = next ? "dark" : "light"
    setVisitorMode(mode)
    applyMode(mode)
  }

  return (
    <header className="fixed inset-x-3 top-3 z-50 mx-auto max-w-5xl">
      <a
        href="#profile-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-md"
      >
        Skip to content
      </a>

      <div
        className={cn(
          "surface rounded-inner px-3 transition-all duration-300 sm:px-4",
          scrolled ? "py-1.5 shadow-lg" : "py-2.5",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${name}, back to top`}
          >
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-avatar bg-gradient-to-br from-primary to-[var(--accent-alt)] text-xs font-bold text-primary-foreground">
              <SafeImage
                src={avatarUrl}
                alt=""
                fallback={<span aria-hidden="true">{initials || "•"}</span>}
              />
            </span>
            <span className="truncate font-display text-base font-semibold tracking-tight">{name}</span>
          </button>

          <nav aria-label="Sections" className="hidden items-center gap-0.5 lg:flex">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={active === s.id ? "location" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate(s.id)
                }}
                className={cn(
                  "rounded-pill px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active === s.id
                    ? "bg-primary/15 font-medium text-accent-text"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon-sm" onClick={toggleTheme} aria-label="Toggle dark mode">
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button
              size="sm"
              className="hidden rounded-pill px-4 sm:inline-flex"
              onClick={() => onNavigate(cta.id)}
            >
              {cta.label}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="profile-mobile-menu"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>

        {open && (
          <nav
            id="profile-mobile-menu"
            aria-label="Sections (mobile)"
            className="mt-2 flex flex-col border-t pt-2 lg:hidden"
          >
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate(s.id)
                }}
                aria-current={active === s.id ? "location" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium",
                  active === s.id ? "bg-primary/15 text-accent-text" : "text-foreground",
                )}
              >
                {s.label}
              </a>
            ))}
            <Button className="mt-2 rounded-pill" onClick={() => onNavigate(cta.id)}>
              {cta.label}
            </Button>
          </nav>
        )}
      </div>
    </header>
  )
}
