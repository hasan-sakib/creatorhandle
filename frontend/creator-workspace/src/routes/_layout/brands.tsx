import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Building2 } from "lucide-react"
import { Suspense, useMemo, useState } from "react"

import { BrandsService } from "@/client"
import { TableFilters } from "@/components/Common/TableFilters"
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
    meta: [{ title: "Brands - CreatorHandle" }],
  }),
})

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Prospect", value: "prospect" },
]

function BrandsTableContent({
  search,
  statusFilter,
}: {
  search: string
  statusFilter: string
}) {
  const { data: brands } = useSuspenseQuery(getBrandsQueryOptions())

  const filtered = useMemo(() => {
    let data = brands.data
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          (b.category ?? "").toLowerCase().includes(q) ||
          (b.contact_name ?? "").toLowerCase().includes(q),
      )
    }
    if (statusFilter !== "all") {
      data = data.filter((b) => (b.status ?? "active") === statusFilter)
    }
    return data
  }, [brands.data, search, statusFilter])

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

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No brands match your search.
      </div>
    )
  }

  return <DataTable columns={columns} data={filtered} />
}

function Brands() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">Manage your brand and client relationships</p>
        </div>
        <AddBrand />
      </div>
      <TableFilters
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search brands..."
        filterOptions={STATUS_OPTIONS}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterPlaceholder="Filter by status"
      />
      <Suspense fallback={<PendingItems />}>
        <BrandsTableContent search={search} statusFilter={statusFilter} />
      </Suspense>
    </div>
  )
}
