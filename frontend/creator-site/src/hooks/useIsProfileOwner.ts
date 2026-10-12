import { useQuery } from "@tanstack/react-query"

import { OpenAPI } from "@/client"

// The dashboard (/app) stores its JWT here; both apps share one origin.
const TOKEN_KEY = "access_token"

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * True when the visitor is signed in to the dashboard as the owner of this
 * profile. Used only to show the owner a "complete your page" checklist;
 * visitors never see it and it carries no extra data.
 */
export function useIsProfileOwner(username: string): boolean {
  const token = readToken()
  const { data } = useQuery({
    queryKey: ["profile-owner", username, !!token],
    enabled: !!token,
    retry: false,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch(`${OpenAPI.BASE}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return false
      const me = (await res.json()) as { username?: string | null }
      return me.username === username
    },
  })
  return data === true
}
