import { Menu, Moon, Sun, X } from "lucide-react"
import { useEffect, useState } from "react"

import { Logo } from "@/components/Common/Logo"
import { Button } from "@/components/ui/button"
import { isDark, setTheme } from "@/lib/theme"
import { dashboardPath } from "@/lib/urls"

const sectionLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#teams", label: "Teams" },
  { href: "#faq", label: "FAQ" },
]

interface NavbarProps {
  /** Show the landing page's section links and mobile menu. Profile pages omit them. */
  marketing?: boolean
}

export function Navbar({ marketing = false }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [dark, setDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setDark(isDark())
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    setTheme(next ? "dark" : "light")
  }

  return (
    <header
      className={[
        "sticky top-0 z-50 w-full border-b transition-colors duration-300",
        scrolled || menuOpen
          ? "border-border bg-background/80 backdrop-blur-xl"
          : "border-transparent bg-transparent",
      ].join(" ")}
    >
      {marketing && (
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-md"
        >
          Skip to content
        </a>
      )}

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href="/"
          className="flex items-center"
          aria-label="CreatorHandle home"
        >
          <Logo variant="full" />
        </a>

        {marketing && (
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {sectionLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className={marketing ? "hidden sm:inline-flex" : undefined}
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <a href={dashboardPath("/login")}>Sign in</a>
          </Button>
          <Button asChild size="sm" className="rounded-full px-4">
            <a href={dashboardPath("/login")}>Get started</a>
          </Button>
          {marketing && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? (
                <X className="size-4" />
              ) : (
                <Menu className="size-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {marketing && menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="border-t md:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-3 sm:px-6">
            {sectionLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-2 py-3 text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
            <a
              href={dashboardPath("/login")}
              className="rounded-md px-2 py-3 text-sm font-medium sm:hidden"
            >
              Sign in
            </a>
            <button
              type="button"
              onClick={toggleDark}
              className="flex items-center gap-2 rounded-md px-2 py-3 text-left text-sm font-medium sm:hidden"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {dark ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </nav>
      )}
    </header>
  )
}
