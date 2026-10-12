import { Building2, Star } from "lucide-react"

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
          <p className="font-display text-lg font-bold leading-tight">{stat.value}</p>
          <p className="text-[11px] text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}

export function BrandMiniCard({ name, category }: { name: string; category: string }) {
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
            <p className="font-display font-semibold leading-tight">Alex Rivera</p>
            <p className="text-sm text-muted-foreground">@alexrivera</p>
          </div>
        </div>
        <ExampleTag />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Tech and workflow creator.</p>
      <div className="mt-5">
        <StatsPill />
      </div>
      <p className="mb-2 mt-5 text-xs font-medium text-muted-foreground">Brands I work with</p>
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

/** Larger page mock-up shown inside a browser frame. */
export function ProfilePageMock() {
  return (
    <div className="space-y-6 p-5 sm:p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar className="size-20 text-xl" />
        <div>
          <p className="font-display text-2xl font-bold tracking-tight">Alex Rivera</p>
          <p className="text-sm text-muted-foreground">@alexrivera</p>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Tech and workflow creator. Reviews, tutorials and brand collaborations.
        </p>
        <StatsPill />
      </div>

      <div>
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Star className="size-4 fill-amber-400 text-amber-400" /> Featured work
        </p>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">Brand One launch video</p>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-500/15 dark:text-green-300">
              Published
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">YouTube · Sponsored integration</p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold">Brands &amp; clients</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {brands.map((brand) => (
            <BrandMiniCard key={brand.name} {...brand} />
          ))}
        </div>
      </div>
    </div>
  )
}
