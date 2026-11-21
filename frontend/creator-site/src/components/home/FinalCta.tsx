import { ArrowRight } from "lucide-react"

import { Reveal } from "@/components/home/Reveal"
import { Button } from "@/components/ui/button"
import { dashboardPath } from "@/lib/urls"

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:pb-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl"
          />
          <h2 className="relative font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Claim your handle.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/85">
            Create your workspace and publish your page when you are ready.
          </p>
          <Button
            asChild
            size="lg"
            className="relative mt-8 rounded-full bg-white px-6 text-primary hover:bg-white/90"
          >
            <a href={dashboardPath("/signup")}>
              Get started free <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </Reveal>
    </section>
  )
}
