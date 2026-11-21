import {
  Building2,
  CheckSquare,
  FolderKanban,
  Home,
  Inbox,
  Users,
  Users2,
} from "lucide-react"

import { SidebarAppearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import { useUnreadInquiries } from "@/hooks/useInquiries"
import { type Item, Main } from "./Main"
import { User } from "./User"
import { WorkspaceSwitcher } from "./WorkspaceSwitcher"

const baseItems: Item[] = [
  { icon: Home, title: "Dashboard", path: "/" },
  { icon: Inbox, title: "Inbox", path: "/inbox" },
  { icon: Building2, title: "Brands", path: "/brands" },
  { icon: FolderKanban, title: "Projects", path: "/projects" },
  { icon: CheckSquare, title: "Tasks", path: "/tasks" },
  { icon: Users2, title: "Team", path: "/team" },
]

export function AppSidebar() {
  const { user: currentUser } = useAuth()
  const unread = useUnreadInquiries()

  const withBadges = baseItems.map((item) =>
    item.path === "/inbox" ? { ...item, badge: unread } : item,
  )
  const items = currentUser?.is_superuser
    ? [...withBadges, { icon: Users, title: "Admin", path: "/admin" }]
    : withBadges

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="px-4 py-5 gap-2">
        <Logo variant="full" />
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <Main items={items} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarAppearance />
        <User user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
