import { createFileRoute } from "@tanstack/react-router"

import { CreatorProfilePage } from "@/components/creator/CreatorProfilePage"

export const Route = createFileRoute("/@{$username}")({
  component: CreatorRoute,
  // The open project lives in the URL (?project=<id>) so it can be shared and
  // the browser's back button closes it.
  validateSearch: (search: Record<string, unknown>): { project?: string } => ({
    project: typeof search.project === "string" && search.project ? search.project : undefined,
  }),
})

function CreatorRoute() {
  const { username } = Route.useParams()
  const { project } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <CreatorProfilePage
      username={username}
      openProjectId={project}
      onOpenProject={(id) => navigate({ search: { project: id }, resetScroll: false })}
      onCloseProject={() => navigate({ search: {}, resetScroll: false })}
    />
  )
}
