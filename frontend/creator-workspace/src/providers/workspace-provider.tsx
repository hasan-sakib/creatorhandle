import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { type WorkspacePublic, WorkspacesService } from "@/client"

export const ACTIVE_WORKSPACE_KEY = "ch-active-workspace"

type WorkspaceContextType = {
  workspaces: WorkspacePublic[]
  activeWorkspaceId: string | null
  activeWorkspace: WorkspacePublic | null
  setActiveWorkspaceId: (id: string) => void
  isLoading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<
    string | null
  >(() => localStorage.getItem(ACTIVE_WORKSPACE_KEY))

  // WorkspaceProvider only ever mounts inside the authenticated _layout route
  // (its beforeLoad already guarantees a valid session), so this always runs.
  const { data, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => WorkspacesService.readWorkspaces(),
  })

  const workspaces = useMemo(() => data?.data ?? [], [data])

  useEffect(() => {
    if (workspaces.length === 0) return
    const stillValid = workspaces.some((w) => w.id === activeWorkspaceId)
    if (!stillValid) {
      setActiveWorkspaceIdState(workspaces[0].id)
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaces[0].id)
    }
  }, [workspaces, activeWorkspaceId])

  const setActiveWorkspaceId = useCallback(
    (id: string) => {
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, id)
      setActiveWorkspaceIdState(id)
      queryClient.invalidateQueries()
    },
    [queryClient],
  )

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) ?? null,
    [workspaces, activeWorkspaceId],
  )

  // Avoid firing every workspace-scoped query with a missing/stale workspace id
  // on first load. Don't unblock just because `data` arrived — the effect above
  // that promotes it into `activeWorkspaceId` runs one render later, so gate on
  // activeWorkspaceId itself and only give up waiting once we've confirmed there
  // really are zero workspaces to select (data settled, list is empty).
  const noWorkspacesToSelect = data !== undefined && workspaces.length === 0
  const stillResolving = !activeWorkspaceId && !noWorkspacesToSelect

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspaceId,
        activeWorkspace,
        setActiveWorkspaceId,
        isLoading,
      }}
    >
      {stillResolving ? (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        children
      )}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context)
    throw new Error("useWorkspace must be used within WorkspaceProvider")
  return context
}
