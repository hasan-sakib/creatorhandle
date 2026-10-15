import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { LogOut, User as UserIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import AppSidebar from "@/components/workspace/Sidebar/AppSidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import { WorkspaceProvider } from "@/components/workspace-provider"
import { getInitials } from "@/utils"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function HeaderUser() {
  const { user, logout } = useAuth()
  const displayName = user?.full_name || user?.email || "User"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 gap-2.5 px-2"
          id="header-user-menu"
        >
          <Avatar className="size-7">
            <AvatarImage src={user?.avatar_url ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-muted text-[11px] font-semibold text-muted-foreground">
              {user ? getInitials(displayName) : <UserIcon className="size-3" />}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-48 truncate text-sm font-medium sm:block">
            {displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{displayName}</p>
            {user?.full_name && (
              <p className="text-xs text-muted-foreground">{user.email}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} id="header-logout-btn" className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 size-4" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Layout() {
  return (
    <WorkspaceProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-card px-4 sm:px-6">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
            <HeaderUser />
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-6xl">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </WorkspaceProvider>
  )
}

export default Layout
