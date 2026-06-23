import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { LogOut, User as UserIcon } from "lucide-react"

import { Footer } from "@/components/Common/Footer"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
          className="flex items-center gap-2.5 px-2 h-9 hover:bg-accent"
          id="header-user-menu"
        >
          <Avatar className="size-8 ring-2 ring-background shadow-sm">
            <AvatarFallback className="bg-slate-800 text-white text-[10px] font-bold">
              {user ? getInitials(displayName) : <UserIcon className="size-3" />}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-xs font-semibold uppercase tracking-wider max-w-40 truncate">
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-background px-6">
          <SidebarTrigger className="-ml-1 text-muted-foreground" />
          <HeaderUser />
        </header>
        <main className="flex-1 p-8 md:p-12">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Layout

