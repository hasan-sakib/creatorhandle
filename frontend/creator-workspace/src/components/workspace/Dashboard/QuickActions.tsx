import { useNavigate } from "@tanstack/react-router"
import { Building2, CheckSquare, FolderKanban } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate({ to: "/projects" })}
          >
            <FolderKanban className="h-4 w-4" />
            Projects
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate({ to: "/tasks" })}
          >
            <CheckSquare className="h-4 w-4" />
            Tasks
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate({ to: "/brands" })}
          >
            <Building2 className="h-4 w-4" />
            Brands
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
