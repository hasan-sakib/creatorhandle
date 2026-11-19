import { type CSSProperties, type ReactNode, useState } from "react"

import { PortalContainerContext } from "@/components/ui/portal-container"
import { ACCENTS, resolveAccent } from "@/lib/accent"
import { resolveTheme, THEMES } from "@/lib/themes"

/**
 * Applies the creator's look to everything inside: the theme (colors, fonts,
 * corners, surfaces) and the accent color (buttons, links, glow). Variables
 * live on this wrapper, not <html>, so nothing leaks to other pages. It is
 * also where dialogs render, so they inherit the same look.
 *
 * Accent = the creator's choice, otherwise the theme's default accent.
 */
export function CreatorScope({
  accent,
  theme,
  children,
}: {
  accent: string | null | undefined
  theme: string | null | undefined
  children: ReactNode
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const themeKey = resolveTheme(theme)
  const accentKey = accent
    ? resolveAccent(accent)
    : THEMES[themeKey].defaultAccent
  const colors = ACCENTS[accentKey]

  return (
    <div
      ref={setContainer}
      data-theme={themeKey}
      data-accent={accentKey}
      style={
        {
          "--accent-light": colors.light,
          "--accent-dark": colors.dark,
        } as CSSProperties
      }
      className="relative min-h-screen bg-background text-foreground"
    >
      <PortalContainerContext.Provider value={container}>
        {children}
      </PortalContainerContext.Provider>
    </div>
  )
}
