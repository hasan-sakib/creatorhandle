import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"

import { PublicService } from "@/client"
import { BrandsSection } from "@/components/PublicProfile/BrandsSection"
import { CreatorHero } from "@/components/PublicProfile/CreatorHero"
import { NotFound } from "@/components/PublicProfile/NotFound"
import { ProjectsSection } from "@/components/PublicProfile/ProjectsSection"
import { Logo } from "@/components/Common/Logo"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/creator/$username")({
  component: CreatorProfilePage,
  head: ({ params }) => ({
    meta: [{ title: `@${params.username} - CreatorHandle` }],
  }),
})

function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 py-16 px-4">
      <Skeleton className="w-24 h-24 rounded-full" />
      <div className="space-y-2 flex flex-col items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-20 w-full max-w-md rounded-xl" />
      <div className="w-full max-w-4xl space-y-4 mt-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    </div>
  )
}

function CreatorProfilePage() {
  const { username } = Route.useParams()

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ["creator", username, "profile"],
    queryFn: () => PublicService.getCreatorProfile({ username }),
    retry: false,
  })

  const notFound = (profileError as { status?: number })?.status === 404

  const { data: brandsData } = useQuery({
    queryKey: ["creator", username, "brands"],
    queryFn: () => PublicService.getCreatorBrands({ username }),
    enabled: !!profile,
  })

  const { data: projectsData } = useQuery({
    queryKey: ["creator", username, "projects"],
    queryFn: () => PublicService.getCreatorProjects({ username }),
    enabled: !!profile,
  })

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/login">
            <Logo variant="full" />
          </Link>
          <Button asChild size="sm">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-16">
        {profileLoading && <ProfileSkeleton />}

        {notFound && <NotFound username={username} />}

        {profile && (
          <>
            <CreatorHero profile={profile} />

            <div className="space-y-12">
              {brandsData && brandsData.data.length > 0 && (
                <BrandsSection brands={brandsData.data} />
              )}
              {projectsData && projectsData.data.length > 0 && (
                <ProjectsSection projects={projectsData.data} />
              )}
              {brandsData && projectsData &&
                brandsData.data.length === 0 &&
                projectsData.data.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="text-lg">Nothing to show yet.</p>
                    <p className="text-sm mt-1">This creator hasn't published any work yet.</p>
                  </div>
                )}
            </div>
          </>
        )}
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Powered by{" "}
        <Link to="/login" className="text-primary font-medium hover:underline">
          CreatorHandle
        </Link>
      </footer>
    </div>
  )
}
