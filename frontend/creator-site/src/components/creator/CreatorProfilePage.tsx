import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"

import { PublicService } from "@/client"
import { AboutSection } from "@/components/creator/AboutSection"
import { AccentScope } from "@/components/creator/AccentScope"
import { AuroraBackground } from "@/components/creator/AuroraBackground"
import { BrandsSection } from "@/components/creator/BrandsSection"
import { ContactSection, hasContactMethods } from "@/components/creator/ContactSection"
import { CreateSection, hasCreateContent } from "@/components/creator/CreateSection"
import { GlassNavbar, type NavSection } from "@/components/creator/GlassNavbar"
import { NotFound } from "@/components/creator/NotFound"
import { OwnerChecklist } from "@/components/creator/OwnerChecklist"
import { ProfileFooter } from "@/components/creator/ProfileFooter"
import { ProfileHero } from "@/components/creator/ProfileHero"
import { ServicesSection } from "@/components/creator/ServicesSection"
import { WorkSection } from "@/components/creator/WorkSection"
import { Skeleton } from "@/components/ui/skeleton"
import { useDocumentMeta } from "@/hooks/useDocumentMeta"
import { useIsProfileOwner } from "@/hooks/useIsProfileOwner"

interface CreatorProfilePageProps {
  username: string
  /** Project shown in the detail dialog (lives in the URL as ?project=). */
  openProjectId?: string
  onOpenProject: (id: string) => void
  onCloseProject: () => void
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-28 sm:px-6" aria-busy="true" aria-label="Loading profile">
      <Skeleton className="h-60 w-full rounded-3xl" />
      <div className="-mt-14 px-6">
        <Skeleton className="size-28 rounded-full ring-4 ring-background" />
        <Skeleton className="mt-6 h-10 w-64" />
        <Skeleton className="mt-3 h-6 w-96 max-w-full" />
      </div>
    </div>
  )
}

export function CreatorProfilePage({
  username,
  openProjectId,
  onOpenProject,
  onCloseProject,
}: CreatorProfilePageProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["creator", username],
    queryFn: () => PublicService.getCreator({ username }),
    retry: false,
  })
  const notFound = (error as { status?: number } | null)?.status === 404
  const isOwner = useIsProfileOwner(username)

  const name = data ? data.full_name || `@${data.username}` : username
  const blurb = data ? [data.headline, (data.about || data.bio)?.slice(0, 140)].filter(Boolean).join(" · ") : null
  useDocumentMeta(
    data ? `${name}${data.headline ? ` – ${data.headline}` : ""} | CreatorHandle` : "CreatorHandle",
    blurb,
  )

  // Sections render after the data arrives, so honor a #hash in the URL once they exist.
  useEffect(() => {
    if (!data || !window.location.hash) return
    const el = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
    el?.scrollIntoView({ block: "start" })
  }, [data])

  if (isLoading) {
    return (
      <AccentScope accent={null}>
        <AuroraBackground />
        <div className="relative">
          <LoadingState />
        </div>
      </AccentScope>
    )
  }

  if (notFound || !data) {
    return (
      <AccentScope accent={null}>
        <AuroraBackground />
        <main className="relative">
          {notFound ? (
            <NotFound username={username} />
          ) : (
            <div className="mx-auto max-w-md px-4 py-32 text-center">
              <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
              <p className="mt-2 text-muted-foreground">We couldn't load this profile. Please try again.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-6 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
              >
                Retry
              </button>
            </div>
          )}
        </main>
      </AccentScope>
    )
  }

  const hasContact = hasContactMethods(data)
  const sections: (NavSection & { show: boolean })[] = [
    { id: "about", label: "About", show: !!(data.about || data.bio) },
    { id: "create", label: "Content", show: hasCreateContent(data) },
    { id: "work", label: "Work", show: data.projects.length > 0 },
    { id: "brands", label: "Brands", show: data.brands.length > 0 },
    { id: "services", label: "Services", show: data.services.length > 0 },
    { id: "contact", label: "Contact", show: hasContact },
  ]

  return (
    <AccentScope accent={data.accent_color}>
      <AuroraBackground />
      <GlassNavbar
        name={name}
        avatarUrl={data.avatar_url}
        sections={sections.filter((s) => s.show).map(({ id, label }) => ({ id, label }))}
        cta={hasContact ? { label: data.availability === "closed" ? "Get in touch" : "Work with me", id: "contact" } : null}
      />
      <main id="profile-main" className="relative">
        <ProfileHero profile={data} hasContact={hasContact} />
        {isOwner && <OwnerChecklist profile={data} />}
        <AboutSection profile={data} />
        <CreateSection profile={data} />
        {data.projects.length > 0 && (
          <WorkSection
            projects={data.projects}
            total={data.projects_total}
            openId={openProjectId}
            onOpen={onOpenProject}
            onClose={onCloseProject}
          />
        )}
        <BrandsSection brands={data.brands} />
        <ServicesSection profile={data} hasContact={hasContact} />
        <ContactSection profile={data} />
      </main>
      <div className="relative">
        <ProfileFooter name={name} />
      </div>
    </AccentScope>
  )
}
