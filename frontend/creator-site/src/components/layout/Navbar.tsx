import { Logo } from "@/components/Common/Logo"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <a href="/creator/">
          <Logo variant="full" />
        </a>
        <div className="flex items-center gap-2">
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
