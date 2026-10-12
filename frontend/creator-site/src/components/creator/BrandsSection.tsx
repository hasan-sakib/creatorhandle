import type { PublicBrand } from "@/client"
import { Section } from "@/components/creator/Section"
import { Reveal } from "@/components/home/Reveal"
import { categoryPill } from "@/lib/categories"
import { cn } from "@/lib/utils"

/** Brands the creator has published work with. Only name and category are public. */
export function BrandsSection({ brands }: { brands: PublicBrand[] }) {
  if (brands.length === 0) return null
  return (
    <Section id="brands" eyebrow="Collaborations" title="Brands I've worked with">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand, i) => (
          <li key={brand.id}>
            <Reveal delay={(i % 3) * 80} className="h-full">
              <div className="glass flex h-full items-center gap-4 rounded-2xl p-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-[var(--accent-alt)]/20 font-display text-lg font-bold text-primary">
                  {brand.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{brand.name}</p>
                  <span
                    className={cn(
                      "mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
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
    </Section>
  )
}
