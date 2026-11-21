import { ArrowRight } from "lucide-react"

import { ProductMock } from "@/components/home/ProductMock"
import { Button } from "@/components/ui/button"
import { dashboardPath } from "@/lib/urls"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Soft teal glow, decorative only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 h-[560px] bg-[radial-gradient(60%_60%_at_72%_35%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent)]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:pb-24 lg:pt-20">
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground shadow-sm">
            <span className="size-1.5 rounded-full bg-primary" />
            For creators and small creator teams
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Run your creator business.{" "}
            <span className="text-primary">Share it with one link.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Keep your brand deals, projects and tasks in one workspace, then
            publish a clean public page at{" "}
            <span className="font-medium text-foreground">
              creatorhandle.com/@yourhandle
            </span>
            .
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-6">
              <a href={dashboardPath("/signup")}>
                Get started free <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full px-6"
            >
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
        </div>

        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:duration-1000">
          <ProductMock />
        </div>
      </div>
    </section>
  )
}
