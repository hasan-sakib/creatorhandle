import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { Suspense, useMemo, useState } from "react"

import { ItemsService } from "@/client"
import { TableFilters } from "@/components/Common/TableFilters"
import { DataTable } from "@/components/Common/DataTable"
import AddItem from "@/components/workspace/Items/AddItem"
import { columns } from "@/components/workspace/Items/columns"
import PendingItems from "@/components/workspace/Pending/PendingItems"

function getItemsQueryOptions() {
  return {
    queryFn: () => ItemsService.readItems({ skip: 0, limit: 100 }),
    queryKey: ["items"],
  }
}

export const Route = createFileRoute("/_layout/items")({
  component: Items,
  head: () => ({
    meta: [{ title: "Items - CreatorHandle" }],
  }),
})

function ItemsTableContent({ search }: { search: string }) {
  const { data: items } = useSuspenseQuery(getItemsQueryOptions())

  const filtered = useMemo(() => {
    if (!search) return items.data
    const q = search.toLowerCase()
    return items.data.filter((i) => i.title.toLowerCase().includes(q))
  }, [items.data, search])

  if (items.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">You don't have any items yet</h3>
        <p className="text-muted-foreground">Add a new item to get started</p>
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No items match your search.
      </div>
    )
  }

  return <DataTable columns={columns} data={filtered} />
}

function Items() {
  const [search, setSearch] = useState("")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Items</h1>
          <p className="text-muted-foreground">Create and manage your items</p>
        </div>
        <AddItem />
      </div>
      <TableFilters
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search items..."
      />
      <Suspense fallback={<PendingItems />}>
        <ItemsTableContent search={search} />
      </Suspense>
    </div>
  )
}
