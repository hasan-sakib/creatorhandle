import type { CreatorProfile } from "@/client"

interface CreatorHeroProps {
  profile: CreatorProfile
}

function getInitials(fullName: string | null, username: string): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  return username.slice(0, 2).toUpperCase()
}

function getMemberYear(createdAt: string | null): string {
  if (!createdAt) return ""
  const year = new Date(createdAt).getFullYear()
  return isNaN(year) ? "" : `Member since ${year}`
}

const stats = [
  { key: "brands_count" as const, label: "Brands" },
  { key: "projects_count" as const, label: "Projects" },
  { key: "tasks_done" as const, label: "Tasks Done" },
  { key: "tasks_total" as const, label: "Total Tasks" },
]

export function CreatorHero({ profile }: CreatorHeroProps) {
  const initials = getInitials(profile.full_name, profile.username)
  const memberSince = getMemberYear(profile.created_at)

  return (
    <div className="flex flex-col items-center text-center py-16 px-4 gap-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg ring-4 ring-background">
          <span className="text-2xl font-bold text-primary-foreground">{initials}</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 ring-2 ring-background" />
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {profile.full_name || profile.username}
        </h1>
        <p className="text-muted-foreground text-lg">@{profile.username}</p>
        {memberSince && (
          <p className="text-sm text-muted-foreground">{memberSince}</p>
        )}
      </div>

      <div className="flex items-center divide-x divide-border rounded-xl border bg-card shadow-sm overflow-hidden">
        {stats.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center px-6 py-4 min-w-[90px]">
            <span className="text-2xl font-bold text-primary">{profile.stats[key]}</span>
            <span className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
