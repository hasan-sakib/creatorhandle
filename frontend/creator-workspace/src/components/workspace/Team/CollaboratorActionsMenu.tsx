import { EllipsisVertical } from "lucide-react"
import { useState } from "react"

import type { CollaboratorPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DeleteCollaborator from "./DeleteCollaborator"
import EditCollaborator from "./EditCollaborator"

interface CollaboratorActionsMenuProps {
  collaborator: CollaboratorPublic
}

export const CollaboratorActionsMenu = ({ collaborator }: CollaboratorActionsMenuProps) => {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EditCollaborator collaborator={collaborator} onSuccess={() => setOpen(false)} />
        <DeleteCollaborator id={collaborator.id} onSuccess={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
