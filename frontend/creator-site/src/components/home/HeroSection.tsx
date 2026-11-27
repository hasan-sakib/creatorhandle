import { Logo } from "@/components/Common/Logo"
import { IllustratedHero } from "@/components/ui/illustrated-hero"
import { dashboardPath } from "@/lib/urls"

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Teams", href: "#teams" },
  { label: "FAQ", href: "#faq" },
  { label: "Sign in", href: dashboardPath("/login") },
]

/**
 * Landing hero: a full-screen paper meadow with its own navbar (the landing
 * page doesn't render the shared Navbar).
 */
export function HeroSection() {
  return (
    <IllustratedHero
      brand="CreatorHandle"
      logo={<Logo variant="full" />}
      navLinks={navLinks}
      copy={{
        headline: ["Run your", "creator business"],
        description: [
          "Brand deals, projects and tasks in one workspace,",
          "plus a public page at creatorhandle.com/@yourhandle",
          "where brands can send you work.",
        ],
        navCta: { label: "Get started", href: dashboardPath("/signup") },
        primaryCta: {
          label: "Get started free",
          href: dashboardPath("/signup"),
        },
        secondaryCta: { label: "See how it works", href: "#how-it-works" },
      }}
    />
  )
}
