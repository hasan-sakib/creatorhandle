import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Building2 } from "lucide-react"
import { Suspense } from "react"

import { BrandsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import AddBrand from "@/components/workspace/Brands/AddBrand"
import { columns } from "@/components/workspace/Brands/columns"
import PendingItems from "@/components/workspace/Pending/PendingItems"

function getBrandsQueryOptions() {
  return {
    queryFn: () => BrandsService.readBrands({ skip: 0, limit: 100 }),
    queryKey: ["brands"],
  }
}

export const Route = createFileRoute("/_layout/brands")({
  component: Brands,
  head: () => ({
    meta: [
      {
        title: "Brands - CreatorHandle",
      },
    ],
  }),
})

function BrandsTableContent() {
  const { data: brands } = useSuspenseQuery(getBrandsQueryOptions())

  if (brands.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No brands yet</h3>
        <p className="text-muted-foreground">Add your first brand to get started</p>
      </div>
    )
  }

  return <DataTable columns={columns} data={brands.data} />
}

function BrandsTable() {
  return (
    <Suspense fallback={<PendingItems />}>
      <BrandsTableContent />
    </Suspense>
  )
}

function Brands() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">Manage your brand and client relationships</p>
        </div>
        <AddBrand />
      </div>
      <BrandsTable />
    </div>
  )
}
