import { useEffect, useRef, useState } from "react"
import { Moon, Sun } from "lucide-react"

import { Logo } from "@/components/Common/Logo"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [dark, setDark] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const stored = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const isDark = stored === "dark" || (!stored && prefersDark)
    setDark(isDark)
    document.documentElement.classList.toggle("dark", isDark)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 20)
      setHidden(y > lastY.current && y > 80)
      lastY.current = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  return (
    <header
      className={[
        "sticky top-0 z-50 w-full",
        "animate-in fade-in slide-in-from-top-2 duration-700",
        "transition-all duration-300 ease-in-out",
        hidden ? "-translate-y-full" : "translate-y-0",
        scrolled
          ? "bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-b border-white/30 dark:border-white/10 shadow-md"
          : "bg-transparent border-b border-transparent",
      ].join(" ")}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="/creator/" className="flex items-center">
          <Logo variant="full" />
        </a>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={toggleDark} aria-label="Toggle dark mode">
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href="/login">Sign In</a>
          </Button>
          <Button asChild size="sm">
            <a href="/login">Get Started</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
