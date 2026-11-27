import { createFileRoute } from "@tanstack/react-router"

import { FaqSection } from "@/components/home/FaqSection"
import { FeaturesSection } from "@/components/home/FeaturesSection"
import { FinalCta } from "@/components/home/FinalCta"
import { HeroSection } from "@/components/home/HeroSection"
import { HowItWorks } from "@/components/home/HowItWorks"
import { PlatformStrip } from "@/components/home/PlatformStrip"
import { ProfileShowcase } from "@/components/home/ProfileShowcase"
import { RolesSection } from "@/components/home/RolesSection"
import { Footer } from "@/components/layout/Footer"

export const Route = createFileRoute("/")({
  // The landing page title and meta tags live in index.html.
  component: HomePage,
})

// The hero brings its own navbar, so this page doesn't render the shared Navbar.
function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main id="main" className="flex-1">
        <HeroSection />
        <PlatformStrip />
        <HowItWorks />
        <FeaturesSection />
        <ProfileShowcase />
        <RolesSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer variant="marketing" />
    </div>
  )
}
