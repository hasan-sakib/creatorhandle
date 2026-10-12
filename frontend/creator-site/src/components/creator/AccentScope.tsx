import { type CSSProperties, type ReactNode, useState } from "react"

import { PortalContainerContext } from "@/components/ui/portal-container"
import { ACCENTS, resolveAccent } from "@/lib/accent"

/**
 * Applies the creator's accent color to everything inside (buttons, links, glow).
 * Variables live on this wrapper, not <html>, so nothing leaks to other pages.
 * It is also where dialogs render, so they inherit the same colors.
 */
export function AccentScope({
  accent,
  children,
}: {
  accent: string | null | undefined
  children: ReactNode
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const colors = ACCENTS[resolveAccent(accent)]

  return (
    <div
      ref={setContainer}
      data-accent={resolveAccent(accent)}
      style={{ "--accent-light": colors.light, "--accent-dark": colors.dark } as CSSProperties}
      className="relative min-h-screen bg-background text-foreground"
    >
      <PortalContainerContext.Provider value={container}>{children}</PortalContainerContext.Provider>
    </div>
  )
}
