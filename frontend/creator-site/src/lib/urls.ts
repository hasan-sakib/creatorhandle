/**
 * Everything is served from one origin: the marketing page at "/", creator
 * profiles at "/@{username}", and the dashboard app under "/app". Links
 * between the apps are therefore plain same-origin paths.
 */

/** Path to a page inside the dashboard app, e.g. dashboardPath("/login"). */
export function dashboardPath(path = "/"): string {
  return `/app${path}`
}

/** Path to a creator's public profile. */
export function profilePath(username: string): string {
  return `/@${username}`
}
