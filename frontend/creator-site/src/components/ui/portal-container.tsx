import { createContext, useContext } from "react"

/**
 * Where dialogs render. The profile's accent colors are CSS variables set on a
 * wrapper element, so dialogs must render inside it (not on <body>) to pick them up.
 */
export const PortalContainerContext = createContext<HTMLElement | null>(null)

export function usePortalContainer(): HTMLElement | undefined {
  return useContext(PortalContainerContext) ?? undefined
}
