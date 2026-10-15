import type { PublicBrand } from "@/client"
import { EmptyState } from "@/components/creator/EmptyState"
import { Section } from "@/components/creator/Section"
import { Reveal } from "@/components/home/Reveal"
import { categoryPill } from "@/lib/categories"
import { cn } from "@/lib/utils"

/** Brands the creator has published work with. Only name and category are public. */
export function BrandsSection({ brands }: { brands: PublicBrand[] }) {
  return (
    <Section id="brands" eyebrow="Collaborations" title="Brands I've worked with">
      {brands.length === 0 ? (
        <EmptyState message="No brand collaborations to show yet." href="/app/projects" />
      ) : (
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand, i) => (
          <li key={brand.id}>
            <Reveal delay={(i % 3) * 80} className="h-full">
              <div className="surface flex h-full items-center gap-4 rounded-inner p-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-tile bg-gradient-to-br from-primary/20 to-[var(--accent-alt)]/20 font-display text-lg font-bold text-accent-text">
                  {brand.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{brand.name}</p>
                  <span
                    className={cn(
                      "mt-1 inline-block rounded-pill px-2 py-0.5 text-[11px] font-medium",
                      categoryPill[brand.category] ?? "bg-muted text-muted-foreground",
                    )}
                  >
                    {brand.category}
                  </span>
                </div>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
      )}
    </Section>
  )
}
