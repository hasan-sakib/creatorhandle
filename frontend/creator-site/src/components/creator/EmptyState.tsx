import { useIsOwner } from "@/components/creator/owner-context"
import { dashboardPath } from "@/lib/urls"

/**
 * What a visitor sees in a section the creator has not filled in yet. The
 * template stays identical for everyone; the owner also gets a shortcut to
 * the place where they can fill it in.
 */
export function EmptyState({
  message,
  settingsTab = "portfolio",
  href,
}: {
  message: string
  /** Settings tab that edits this section (ignored when `href` is given). */
  settingsTab?: string
  href?: string
}) {
  const isOwner = useIsOwner()
  return (
    <div className="rounded-inner border border-dashed bg-background/40 px-6 py-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {isOwner && (
        <a
          href={href ?? `${dashboardPath("/settings")}?tab=${settingsTab}`}
          className="mt-2 inline-block text-sm font-medium text-accent-text hover:underline"
        >
          Add this in Settings
        </a>
      )}
    </div>
  )
}
