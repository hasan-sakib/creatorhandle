import { Building2 } from "lucide-react"

import { Card } from "@/components/ui/card"
import { categoryPill } from "@/lib/categories"
import { cn } from "@/lib/utils"

/** Illustrative data only: shown on the landing page, always labelled as an example. */
const brands = [
  { name: "Brand One", category: "Tech" },
  { name: "Studio Two", category: "Beauty" },
  { name: "Acme Co", category: "Food" },
]

const stats = [
  { label: "Projects", value: "14" },
  { label: "Brands", value: "8" },
  { label: "Platforms", value: "3" },
]

export function Avatar({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "grid place-items-center rounded-full bg-gradient-to-br from-primary to-teal-300 font-display font-bold text-primary-foreground",
        className,
      )}
    >
      AR
    </div>
  )
}

export function ExampleTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full border bg-background px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      Example profile
    </span>
  )
}

export function StatsPill() {
  return (
    <div className="inline-flex divide-x rounded-xl border bg-card shadow-sm">
      {stats.map((stat) => (
        <div key={stat.label} className="px-4 py-2 text-center sm:px-5">
          <p className="font-display text-lg font-bold leading-tight">
            {stat.value}
          </p>
          <p className="text-[11px] text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}

export function BrandMiniCard({
  name,
  category,
}: {
  name: string
  category: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10">
        <Building2 className="size-[18px] text-primary" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{name}</p>
        <span
          className={cn(
            "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
            categoryPill[category],
          )}
        >
          {category}
        </span>
      </div>
    </div>
  )
}

/** Compact profile card used in the hero collage. */
export function ProfileCardCompact({ className }: { className?: string }) {
  return (
    <Card className={cn("gap-0 p-5 shadow-lg", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 text-sm" />
          <div>
            <p className="font-display font-semibold leading-tight">
              Alex Rivera
            </p>
            <p className="text-sm text-muted-foreground">@alexrivera</p>
          </div>
        </div>
        <ExampleTag />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Tech and workflow creator.
      </p>
      <div className="mt-5">
        <StatsPill />
      </div>
      <p className="mb-2 mt-5 text-xs font-medium text-muted-foreground">
        Brands I work with
      </p>
      <div className="flex flex-wrap gap-2">
        {brands.map((brand) => (
          <span
            key={brand.name}
            className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium"
          >
            {brand.name}
          </span>
        ))}
      </div>
    </Card>
  )
}

const mockNav = [
  "Home",
  "About",
  "Approach",
  "Services",
  "Work",
  "Brands",
  "Contact",
]
const mockSteps = ["Discover", "Script and plan", "Shoot and edit"]

/**
 * A compact version of the real portfolio template, drawn with the same
 * semantic classes the real page uses, so it takes on whatever theme wraps it.
 */
export function ProfilePageMock() {
  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="surface flex items-center gap-3 rounded-inner px-3 py-2">
        <span className="grid size-6 place-items-center rounded-avatar bg-gradient-to-br from-primary to-[var(--accent-alt)] text-[9px] font-bold text-primary-foreground">
          AR
        </span>
        <span className="text-xs font-semibold">Alex Rivera</span>
        <ul className="ml-auto hidden items-center gap-2.5 text-[10px] text-muted-foreground sm:flex">
          {mockNav.map((n, i) => (
            <li
              key={n}
              className={i === 0 ? "font-semibold text-accent-text" : undefined}
            >
              {n}
            </li>
          ))}
        </ul>
        <span className="ml-auto rounded-pill bg-primary px-2 py-0.5 text-[9px] font-medium text-primary-foreground sm:ml-0">
          Work with me
        </span>
      </div>

      <div className="surface overflow-hidden rounded-card">
        <div
          className="h-16 sm:h-20"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklch, var(--accent-raw) 40%, transparent), color-mix(in oklch, var(--accent-alt) 40%, transparent))",
          }}
        />
        <div className="-mt-6 flex items-end gap-3 px-4 pb-4">
          <Avatar className="size-14 rounded-avatar text-base ring-4 ring-background" />
          <div className="pb-1">
            <p className="heading text-lg leading-tight">Alex Rivera</p>
            <p className="text-[11px] text-muted-foreground">
              Tech YouTuber and gadget reviewer
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="eyebrow">Work style</p>
        <p className="heading mb-2 text-base">How I work</p>
        <div className="grid grid-cols-3 gap-2">
          {mockSteps.map((step, i) => (
            <div key={step} className="surface rounded-inner p-2.5">
              <p className="heading text-lg text-accent-text/40">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold">{step}</p>
              <div className="mt-1.5 h-1 w-4/5 rounded-full bg-muted-foreground/25" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow">Previous work</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {brands.map((brand) => (
            <BrandMiniCard key={brand.name} {...brand} />
          ))}
        </div>
      </div>
    </div>
  )
}
