import { createFileRoute } from "@tanstack/react-router"

import { Footer } from "@/components/layout/Footer"
import { Navbar } from "@/components/layout/Navbar"
import { FeaturesSection } from "@/components/home/FeaturesSection"
import { HeroSection } from "@/components/home/HeroSection"

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [{ title: "CreatorHandle — Manage your creator brand" }],
  }),
})

function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  )
}
