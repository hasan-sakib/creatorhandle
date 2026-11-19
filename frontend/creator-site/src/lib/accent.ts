/** Accent presets creators can pick for their page (shared with the dashboard). */
import {
  ACCENT_PRESETS as ACCENTS,
  type AccentKey,
} from "@creatorhandle/shared/accents"

export { ACCENTS }
export type { AccentKey }

export function resolveAccent(key: string | null | undefined): AccentKey {
  return key && key in ACCENTS ? (key as AccentKey) : "teal"
}
