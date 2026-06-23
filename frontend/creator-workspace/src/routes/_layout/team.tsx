import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Users2 } from "lucide-react"
import { Suspense, useMemo, useState } from "react"

import { CollaboratorsService } from "@/client"
import { TableFilters } from "@/components/Common/TableFilters"
import { DataTable } from "@/components/Common/DataTable"
import AddCollaborator from "@/components/workspace/Team/AddCollaborator"
import { columns } from "@/components/workspace/Team/columns"
import PendingItems from "@/components/workspace/Pending/PendingItems"

function getCollaboratorsQueryOptions() {
  return {
    queryFn: () => CollaboratorsService.readCollaborators({ skip: 0, limit: 100 }),
    queryKey: ["collaborators"],
  }
}

export const Route = createFileRoute("/_layout/team")({
  component: Team,
  head: () => ({
    meta: [{ title: "Team - CreatorHandle" }],
  }),
})

const ROLE_OPTIONS = [
  { label: "Manager", value: "Manager" },
  { label: "Designer", value: "Designer" },
  { label: "Developer", value: "Developer" },
  { label: "Writer", value: "Writer" },
  { label: "Editor", value: "Editor" },
]

function TeamTableContent({
  search,
  roleFilter,
}: {
  search: string
  roleFilter: string
}) {
  const { data: collaborators } = useSuspenseQuery(getCollaboratorsQueryOptions())

  const filtered = useMemo(() => {
    let data = collaborators.data
    if (search) {
      const q = search.toLowerCase()
      data = data.filter((c) => c.name.toLowerCase().includes(q))
    }
    if (roleFilter !== "all") {
      data = data.filter((c) => c.role === roleFilter)
    }
    return data
  }, [collaborators.data, search, roleFilter])

  if (collaborators.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Users2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No collaborators yet</h3>
        <p className="text-muted-foreground">Add team members to assign them to tasks</p>
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No collaborators match your search.
      </div>
    )
  }

  return <DataTable columns={columns} data={filtered} />
}

function Team() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">Manage collaborators and assign them to tasks</p>
        </div>
        <AddCollaborator />
      </div>
      <TableFilters
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search collaborators..."
        filterOptions={ROLE_OPTIONS}
        filterValue={roleFilter}
        onFilterChange={setRoleFilter}
        filterPlaceholder="Filter by role"
      />
      <Suspense fallback={<PendingItems />}>
        <TeamTableContent search={search} roleFilter={roleFilter} />
      </Suspense>
    </div>
  )
}
