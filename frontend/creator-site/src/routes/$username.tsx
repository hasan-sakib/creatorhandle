import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { PublicService } from "@/client"
import { BackToTop } from "@/components/creator/BackToTop"
import { BrandsSection } from "@/components/creator/BrandsSection"
import { ContactSection } from "@/components/creator/ContactSection"
import { CreatorHero } from "@/components/creator/CreatorHero"
import { NotFound } from "@/components/creator/NotFound"
import { ProjectsSection } from "@/components/creator/ProjectsSection"
import { Footer } from "@/components/layout/Footer"
import { Navbar } from "@/components/layout/Navbar"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/$username")({
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
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ["creator", username, "profile"],
    queryFn: () => PublicService.getCreatorProfile({ username }),
    retry: false,
  })

  const notFound = (profileError as { status?: number })?.status === 404

  const { data: brandsData, isLoading: brandsLoading } = useQuery({
    queryKey: ["creator", username, "brands"],
    queryFn: () => PublicService.getCreatorBrands({ username }),
    enabled: !!profile,
  })

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["creator", username, "projects"],
    queryFn: () => PublicService.getCreatorProjects({ username }),
    enabled: !!profile,
  })

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-16">
        {profileLoading && <ProfileSkeleton />}

        {notFound && <NotFound username={username} />}

        {profile && (
          <>
            <CreatorHero profile={profile} />

            <div className="space-y-12">
              <BrandsSection
                brands={brandsData?.data ?? []}
                isLoading={brandsLoading}
                selectedBrandId={selectedBrandId}
                onSelectBrand={setSelectedBrandId}
              />

              <ProjectsSection
                projects={projectsData?.data ?? []}
                brands={brandsData?.data ?? []}
                isLoading={projectsLoading}
                brandFilter={selectedBrandId}
              />

              {brandsData && projectsData &&
                brandsData.data.length === 0 &&
                projectsData.data.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="text-lg">Nothing to show yet.</p>
                    <p className="text-sm mt-1">This creator hasn't published any work yet.</p>
                  </div>
                )}

              <ContactSection profile={profile} />
            </div>
          </>
        )}
      </main>

      <Footer />
      <BackToTop />
    </div>
  )
}
