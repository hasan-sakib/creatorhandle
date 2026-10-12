import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

import { WorkspacesService } from "@/client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/components/workspace-provider"
import useCustomToast from "@/hooks/useCustomToast"
import { getInitials } from "@/utils"
import useAuth from "@/hooks/useAuth"

const ROLES = ["owner", "admin", "manager", "member", "viewer"] as const
const MANAGER_ROLES = ["owner", "admin"]

export default function WorkspaceMembers() {
  const { activeWorkspace } = useWorkspace()
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const { data, isLoading } = useQuery({
    queryKey: ["workspace-members", activeWorkspace?.id],
    queryFn: () =>
      WorkspacesService.readWorkspaceMembers({ id: activeWorkspace!.id }),
    enabled: !!activeWorkspace,
  })

  const canManage = activeWorkspace ? MANAGER_ROLES.includes(activeWorkspace.role ?? "") : false

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["workspace-members", activeWorkspace?.id] })

  const handleRoleChange = async (userId: string, role: string) => {
    if (!activeWorkspace) return
    try {
      await WorkspacesService.updateWorkspaceMember({
        id: activeWorkspace.id,
        userId,
        requestBody: { role },
      })
      showSuccessToast("Member role updated")
      invalidate()
    } catch (err: any) {
      showErrorToast(err?.body?.detail ?? "Could not update role")
    }
  }

  const handleRemove = async (userId: string) => {
    if (!activeWorkspace) return
    try {
      await WorkspacesService.removeWorkspaceMember({ id: activeWorkspace.id, userId })
      showSuccessToast("Member removed")
      invalidate()
    } catch (err: any) {
      showErrorToast(err?.body?.detail ?? "Could not remove member")
    }
  }

  if (!activeWorkspace) return null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium">{activeWorkspace.name}</h3>
        <p className="text-xs text-muted-foreground">
          Members of this workspace and their roles
        </p>
      </div>
      <div className="flex flex-col divide-y divide-border rounded-md border">
        {data?.data.map((member) => (
          <div key={member.id} className="flex items-center gap-3 p-3">
            <Avatar className="size-8">
              <AvatarFallback className="bg-zinc-600 text-white text-xs">
                {getInitials(member.full_name || member.email || "?")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {member.full_name || member.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
            </div>
            {canManage && member.user_id !== currentUser?.id ? (
              <div className="flex items-center gap-2">
                <Select
                  value={member.role}
                  onValueChange={(role) => handleRoleChange(member.user_id, role)}
                >
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleRemove(member.user_id)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <Badge variant="secondary" className="capitalize">
                {member.role}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
