import { useQuery } from "@tanstack/react-query"
import { useEffect, useLayoutEffect } from "react"

import { PublicService } from "@/client"
import { AboutSection } from "@/components/creator/AboutSection"
import { ApproachSection } from "@/components/creator/ApproachSection"
import { CreatorScope } from "@/components/creator/CreatorScope"
import { PageBackground } from "@/components/creator/PageBackground"
import { BrandsSection } from "@/components/creator/BrandsSection"
import { ContactSection, hasContactMethods } from "@/components/creator/ContactSection"
import { GlassNavbar } from "@/components/creator/GlassNavbar"
import { NotFound } from "@/components/creator/NotFound"
import { OwnerChecklist } from "@/components/creator/OwnerChecklist"
import { OwnerContext } from "@/components/creator/owner-context"
import { ProfileFooter } from "@/components/creator/ProfileFooter"
import { ProfileHero } from "@/components/creator/ProfileHero"
import { LEGACY_HASHES, NAV_SECTIONS } from "@/components/creator/sections"
import { ServicesSection } from "@/components/creator/ServicesSection"
import { WorkSection } from "@/components/creator/WorkSection"
import { Skeleton } from "@/components/ui/skeleton"
import { useDocumentMeta } from "@/hooks/useDocumentMeta"
import { useIsProfileOwner } from "@/hooks/useIsProfileOwner"
import { applyMode, rememberLook, resolveMode, restoreSiteMode } from "@/lib/profileMode"
import { useThemeFont } from "@/lib/themes"

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
      <Skeleton className="h-60 w-full rounded-card" />
      <div className="-mt-14 px-6">
        <Skeleton className="size-28 rounded-avatar ring-4 ring-background" />
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

  // Light/dark: visitor's choice, then the creator's default, then the device.
  // Applied to <html> so Tailwind's dark variant (and dialogs) follow it; the
  // site-wide theme is restored when leaving the page.
  const creatorMode = data?.color_mode
  useLayoutEffect(() => {
    applyMode(resolveMode(creatorMode))
    return restoreSiteMode
  }, [creatorMode])
  useEffect(() => {
    if (data) rememberLook(username, data.color_mode)
  }, [data, username])

  // Wait for the theme's font before revealing the page (bounded by a timeout)
  const fontReady = useThemeFont(data?.theme, !!data)

  const name = data ? data.full_name || `@${data.username}` : username
  const blurb = data ? [data.headline, (data.about || data.bio)?.slice(0, 140)].filter(Boolean).join(" · ") : null
  useDocumentMeta(
    data ? `${name}${data.headline ? ` – ${data.headline}` : ""} | CreatorHandle` : "CreatorHandle",
    blurb,
  )

  // Sections render after the data arrives, so honor a #hash in the URL once they exist.
  useEffect(() => {
    if (!data || !window.location.hash) return
    const raw = decodeURIComponent(window.location.hash.slice(1))
    const el = document.getElementById(LEGACY_HASHES[raw] ?? raw)
    el?.scrollIntoView({ block: "start" })
  }, [data])

  if (isLoading || (data && !fontReady)) {
    return (
      <CreatorScope accent={null} theme={null}>
        <PageBackground />
        <div className="relative">
          <LoadingState />
        </div>
      </CreatorScope>
    )
  }

  if (notFound || !data) {
    return (
      <CreatorScope accent={null} theme={null}>
        <PageBackground />
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
                className="mt-6 rounded-pill bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
              >
                Retry
              </button>
            </div>
          )}
        </main>
      </CreatorScope>
    )
  }

  const hasContact = hasContactMethods(data)

  return (
    <OwnerContext.Provider value={isOwner}>
      <CreatorScope accent={data.accent_color} theme={data.theme}>
        <PageBackground />
        <GlassNavbar
          name={name}
          avatarUrl={data.avatar_url}
          sections={[...NAV_SECTIONS]}
          cta={{ label: data.availability === "closed" ? "Get in touch" : "Work with me", id: "contact" }}
        />
        <main id="profile-main" className="relative">
          <ProfileHero profile={data} />
          {isOwner && <OwnerChecklist profile={data} />}
          <AboutSection profile={data} />
          <ApproachSection profile={data} />
          <ServicesSection profile={data} hasContact={hasContact} />
          <WorkSection
            projects={data.projects}
            total={data.projects_total}
            openId={openProjectId}
            onOpen={onOpenProject}
            onClose={onCloseProject}
          />
          <BrandsSection brands={data.brands} />
          <ContactSection profile={data} />
        </main>
        <div className="relative">
          <ProfileFooter name={name} />
        </div>
      </CreatorScope>
    </OwnerContext.Provider>
  )
}
