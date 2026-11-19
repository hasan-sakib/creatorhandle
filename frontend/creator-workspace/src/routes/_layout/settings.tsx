import { createFileRoute } from "@tanstack/react-router"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AppearanceSettings from "@/components/workspace/UserSettings/AppearanceSettings"
import ChangePassword from "@/components/workspace/UserSettings/ChangePassword"
import DeleteAccount from "@/components/workspace/UserSettings/DeleteAccount"
import PortfolioSettings from "@/components/workspace/UserSettings/PortfolioSettings"
import UserInformation from "@/components/workspace/UserSettings/UserInformation"
import WorkspaceMembers from "@/components/workspace/UserSettings/WorkspaceMembers"
import useAuth from "@/hooks/useAuth"

const tabsConfig = [
  { value: "my-profile", title: "My profile", component: UserInformation },
  { value: "portfolio", title: "Portfolio", component: PortfolioSettings },
  { value: "password", title: "Password", component: ChangePassword },
  { value: "appearance", title: "Appearance", component: AppearanceSettings },
  { value: "workspace", title: "Workspace", component: WorkspaceMembers },
  { value: "danger-zone", title: "Danger zone", component: DeleteAccount },
]

export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
  // ?tab=portfolio opens that tab (used by links from the public page)
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  head: () => ({
    meta: [
      {
        title: "Settings - CreatorHandle",
      },
    ],
  }),
})

function UserSettings() {
  const { user: currentUser } = useAuth()
  const { tab } = Route.useSearch()
  const navigate = Route.useNavigate()
  // Superusers don't get the "Danger zone" tab (it's last)
  const finalTabs = currentUser?.is_superuser
    ? tabsConfig.slice(0, -1)
    : tabsConfig

  if (!currentUser) {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs
        value={finalTabs.some((t) => t.value === tab) ? tab : "my-profile"}
        onValueChange={(value) =>
          navigate({ search: { tab: value }, replace: true })
        }
      >
        <TabsList>
          {finalTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {finalTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <tab.component />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
