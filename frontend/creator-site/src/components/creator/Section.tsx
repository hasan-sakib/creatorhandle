import type { ReactNode } from "react"

import { Reveal } from "@/components/home/Reveal"
import { cn } from "@/lib/utils"

interface SectionProps {
  id: string
  eyebrow?: string
  title: string
  children: ReactNode
  className?: string
}

/** Consistent heading + spacing for each portfolio section. `id` is the nav anchor. */
export function Section({
  id,
  eyebrow,
  title,
  children,
  className,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        "relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16",
        className,
      )}
    >
      <Reveal>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 id={`${id}-title`} className="heading text-3xl sm:text-4xl">
          {title}
        </h2>
      </Reveal>
      <div className="mt-8">{children}</div>
    </section>
  )
}

/** Accent-tinted gradient used where an image is missing. */
export function GradientFallback({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("grid size-full place-items-center", className)}
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklch, var(--accent-raw) 38%, transparent), color-mix(in oklch, var(--accent-alt) 38%, transparent))",
      }}
    >
      {children}
    </div>
  )
}
