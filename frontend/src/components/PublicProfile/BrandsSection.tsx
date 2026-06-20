import { Building2 } from "lucide-react"

import type { BrandPublic } from "@/client"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface BrandsSectionProps {
  brands: BrandPublic[]
}

const categoryColors: Record<string, string> = {
  Beauty: "bg-pink-100 text-pink-700 border-pink-200",
  Tech: "bg-blue-100 text-blue-700 border-blue-200",
  Food: "bg-orange-100 text-orange-700 border-orange-200",
  Fashion: "bg-purple-100 text-purple-700 border-purple-200",
  Gaming: "bg-green-100 text-green-700 border-green-200",
  Other: "bg-gray-100 text-gray-700 border-gray-200",
}

function BrandCard({ brand }: { brand: BrandPublic }) {
  const isActive = brand.status === "active"
  const categoryColor = categoryColors[brand.category ?? "Other"] ?? categoryColors["Other"]

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
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
              "flex-shrink-0 w-2 h-2 rounded-full mt-1.5",
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

export function BrandsSection({ brands }: BrandsSectionProps) {
  if (brands.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Brands & Clients</h2>
        <span className="text-sm text-muted-foreground ml-1">({brands.length})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {brands.map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>
    </section>
  )
}
