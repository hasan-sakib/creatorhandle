import type { PublicCreator } from "@/client"
import { EmptyState } from "@/components/creator/EmptyState"
import { Section } from "@/components/creator/Section"
import { firstName } from "@/components/creator/sections"
import { Reveal } from "@/components/home/Reveal"

export function hasApproachContent(p: PublicCreator) {
  return (
    p.work_steps.length + p.work_principles.length + p.work_tools.length > 0
  )
}

function Chips({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="surface rounded-card p-6">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <ul className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-pill border bg-background/60 px-3 py-1 text-sm font-medium"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Work style: how the creator works (process steps), what they stand for, and the tools they use. */
export function ApproachSection({ profile }: { profile: PublicCreator }) {
  return (
    <Section id="approach" eyebrow="Work style" title="How I work">
      {!hasApproachContent(profile) ? (
        <EmptyState
          message={`${firstName(profile)} hasn't shared how they work yet.`}
        />
      ) : (
        <div className="space-y-8">
          {profile.work_steps.length > 0 && (
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.work_steps.map((step, i) => (
                <li key={step.title}>
                  <Reveal delay={(i % 3) * 80} className="h-full">
                    <div className="surface h-full rounded-card p-6">
                      <span className="font-display text-4xl font-bold text-accent-text/40">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="mt-3 font-display text-lg font-semibold">
                        {step.title}
                      </h3>
                      {step.description && (
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          )}
          {(profile.work_principles.length > 0 ||
            profile.work_tools.length > 0) && (
            <Reveal className="grid gap-4 md:grid-cols-2">
              <Chips title="What I stand for" items={profile.work_principles} />
              <Chips title="Tools I use" items={profile.work_tools} />
            </Reveal>
          )}
        </div>
      )}
    </Section>
  )
}
