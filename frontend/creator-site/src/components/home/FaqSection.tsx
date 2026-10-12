import { ChevronDown } from "lucide-react"

import { Reveal } from "@/components/home/Reveal"

const faqs = [
  {
    q: "How do I publish my page?",
    a: "Open Settings in the dashboard, choose a username, then switch on “Publish your website”. Your page goes live right away at /@username.",
  },
  {
    q: "Can I unpublish it?",
    a: "Yes. Switch the same toggle off and your page stops being public immediately. Your data stays safe in your workspace.",
  },
  {
    q: "What is visible on my public page?",
    a: "The profile details you fill in (name, headline, about, links, contact email), the niches and services you add, your Published projects with featured work first, and the brands tied to them. Planning work, tasks, brand notes and brand contacts are never shown.",
  },
  {
    q: "Does it support teams?",
    a: "Yes. Workspaces have five roles (owner, admin, manager, member and viewer), and you can assign tasks to collaborators.",
  },
  {
    q: "How can I sign in?",
    a: "With your email and password, or with your Google account. Password recovery is built in.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-28">
      <Reveal className="text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
      </Reveal>

      <Reveal delay={100} className="mt-10 divide-y rounded-2xl border bg-card shadow-sm">
        {faqs.map((item, i) => (
          <details key={item.q} className="group px-6 py-5" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </Reveal>
    </section>
  )
}
