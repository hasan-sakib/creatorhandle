import { UserX } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NotFoundProps {
  username: string
}

export function NotFound({ username }: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-4 gap-6">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
        <UserX className="w-10 h-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Creator not found</h1>
        <p className="text-muted-foreground max-w-sm">
          There's no creator with the handle <span className="font-medium text-foreground">@{username}</span>.
          They may not have set up their public profile yet.
        </p>
      </div>
      <Button asChild variant="outline">
        <a href="/login">Go to CreatorHandle</a>
      </Button>
    </div>
  )
}
