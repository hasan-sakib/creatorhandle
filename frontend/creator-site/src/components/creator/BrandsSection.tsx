import { Building2 } from "lucide-react"
import { useMemo, useState } from "react"

import type { BrandPublic } from "@/client"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface BrandsSectionProps {
  brands: BrandPublic[]
  isLoading?: boolean
  selectedBrandId?: string | null
  onSelectBrand?: (id: string | null) => void
}

const categoryColors: Record<string, string> = {
  Beauty: "bg-pink-100 text-pink-700 border-pink-200",
  Tech: "bg-blue-100 text-blue-700 border-blue-200",
  Food: "bg-orange-100 text-orange-700 border-orange-200",
  Fashion: "bg-purple-100 text-purple-700 border-purple-200",
  Gaming: "bg-green-100 text-green-700 border-green-200",
  Other: "bg-gray-100 text-gray-700 border-gray-200",
}

function BrandCard({
  brand,
  isSelected,
  onClick,
}: {
  brand: BrandPublic
  isSelected: boolean
  onClick: () => void
}) {
  const isActive = brand.status === "active"
  const categoryColor = categoryColors[brand.category ?? "Other"] ?? categoryColors["Other"]

  return (
    <Card
      className={cn(
        "group hover:shadow-md transition-all duration-200 cursor-pointer select-none",
        isSelected && "ring-2 ring-primary shadow-md",
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{brand.name}</p>
              {brand.contact_name && (
                <p className="text-xs text-muted-foreground truncate">{brand.contact_name}</p>
              )}
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 w-2 h-2 rounded-full mt-1.5",
              isActive ? "bg-green-500" : "bg-gray-400",
            )}
            title={isActive ? "Active" : "Inactive"}
          />
        </div>
        {brand.category && brand.category !== "Other" && (
          <div className="mt-3">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                categoryColor,
              )}
            >
              {brand.category}
            </span>
          </div>
        )}
        {brand.notes && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{brand.notes}</p>
        )}
      </CardContent>
    </Card>
  )
}

function BrandCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

export function BrandsSection({
  brands,
  isLoading,
  selectedBrandId,
  onSelectBrand,
}: BrandsSectionProps) {
  const [categoryFilter, setCategoryFilter] = useState("All")

  const categories = useMemo(() => {
    const cats = brands
      .map((b) => b.category)
      .filter((c): c is string => !!c && c !== "Other")
    return ["All", ...Array.from(new Set(cats))]
  }, [brands])

  const filtered = useMemo(() => {
    if (categoryFilter === "All") return brands
    return brands.filter((b) => b.category === categoryFilter)
  }, [brands, categoryFilter])

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <BrandCardSkeleton key={i} />)}
        </div>
      </section>
    )
  }

  if (brands.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Brands & Clients</h2>
        </div>
        <div className="py-12 text-center rounded-xl border border-dashed">
          <Building2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No brand partnerships yet — check back soon.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Brands & Clients</h2>
        <span className="text-sm text-muted-foreground ml-1">({brands.length})</span>
      </div>

      {categories.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium transition-colors border",
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {selectedBrandId && onSelectBrand && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Showing projects for <strong className="text-foreground">{brands.find((b) => b.id === selectedBrandId)?.name}</strong></span>
          <button
            type="button"
            onClick={() => onSelectBrand(null)}
            className="text-xs underline hover:no-underline"
          >
            Clear
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((brand) => (
          <BrandCard
            key={brand.id}
            brand={brand}
            isSelected={selectedBrandId === brand.id}
            onClick={() => onSelectBrand?.(selectedBrandId === brand.id ? null : brand.id)}
          />
        ))}
      </div>
    </section>
  )
}
