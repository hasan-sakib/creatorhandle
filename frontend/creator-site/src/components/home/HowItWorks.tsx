import { Globe, ListChecks, UserPlus } from "lucide-react"

import { Reveal } from "@/components/home/Reveal"
import { Card } from "@/components/ui/card"

const steps = [
  {
    icon: UserPlus,
    title: "Sign up",
    text: "Use email or Google. A personal workspace is created for you.",
  },
  {
    icon: ListChecks,
    title: "Add your work",
    text: "Log brands, projects and tasks as you go.",
  },
  {
    icon: Globe,
    title: "Publish your handle",
    text: "Pick a username and switch on your public page at /@handle.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          From sign-up to published in three steps
        </h2>
        <p className="mt-4 text-muted-foreground">
          No setup project. Start tracking today and share your page whenever you are ready.
        </p>
      </Reveal>

      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <li key={title}>
            <Reveal delay={i * 100} className="h-full">
              <Card className="h-full gap-4 p-6 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-display text-4xl font-bold text-muted-foreground/30">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </Card>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  )
}
