import { Logo } from "@/components/Common/Logo"
import { dashboardPath } from "@/lib/urls"

interface FooterProps {
  /** "powered" is the slim line shown on creator profile pages. */
  variant?: "powered" | "marketing"
}

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#teams", label: "Teams" },
  { href: "#faq", label: "FAQ" },
]

export function Footer({ variant = "powered" }: FooterProps) {
  if (variant === "powered") {
    return (
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Powered by{" "}
        <a href="/" className="text-primary font-medium hover:underline">
          CreatorHandle
        </a>
      </footer>
    )
  }

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Logo variant="full" />
          <p className="mt-3 text-sm text-muted-foreground">
            Manage your creator brand.
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-8 gap-y-3 text-sm"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <a
            href={dashboardPath("/login")}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </a>
        </nav>
      </div>
      <div className="border-t py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CreatorHandle
      </div>
    </footer>
  )
}
