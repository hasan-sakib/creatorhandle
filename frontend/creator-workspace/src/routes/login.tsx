import { useGoogleLogin } from "@react-oauth/google"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import type { ApiError } from "@/client"
import { LoginService } from "@/client"
import { AnimatedCharactersLoginPage } from "@/components/ui/animated-characters-login-page"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/login")({
  // Always show the sign-in form (no redirect for an existing session), so
  // "Sign in" works for switching accounts. Signing in replaces the old token.
  component: Login,
  head: () => ({
    meta: [{ title: "Log In - CreatorHandle" }],
  }),
})

function Login() {
  const { loginMutation } = useAuth()
  const navigate = useNavigate()
  const [googleError, setGoogleError] = useState<string | undefined>()

  const handleSubmit = (data: { username: string; password: string }) => {
    if (loginMutation.isPending) return
    loginMutation.mutate(data)
  }

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await LoginService.loginWithGoogle({ requestBody: { token: tokenResponse.access_token } })
        localStorage.setItem("access_token", res.access_token)
        navigate({ to: "/" })
      } catch {
        setGoogleError("Google sign-in failed. Please try again.")
      }
    },
    onError: () => setGoogleError("Google sign-in was cancelled or failed."),
  })

  const apiErrorBody = (loginMutation.error as ApiError)?.body as
    | Record<string, unknown>
    | undefined
  const errorMessage = loginMutation.isError
    ? (apiErrorBody?.detail as string | undefined) ?? "Invalid email or password."
    : googleError

  return (
    <AnimatedCharactersLoginPage
      onSubmit={handleSubmit}
      isLoading={loginMutation.isPending}
      externalError={errorMessage}
      onGoogleLogin={() => { setGoogleError(undefined); triggerGoogleLogin() }}
    />
  )
}
