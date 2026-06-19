import { createFileRoute, redirect } from "@tanstack/react-router"

import type { ApiError } from "@/client"
import { AnimatedCharactersLoginPage } from "@/components/ui/animated-characters-login-page"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({ to: "/" })
    }
  },
  head: () => ({
    meta: [{ title: "Log In - CreatorHandle" }],
  }),
})

function Login() {
  const { loginMutation } = useAuth()

  const handleSubmit = (data: { username: string; password: string }) => {
    if (loginMutation.isPending) return
    loginMutation.mutate(data)
  }

  const apiErrorBody = (loginMutation.error as ApiError)?.body as
    | Record<string, unknown>
    | undefined
  const errorMessage = loginMutation.isError
    ? (apiErrorBody?.detail as string | undefined) ?? "Invalid email or password."
    : undefined

  return (
    <AnimatedCharactersLoginPage
      onSubmit={handleSubmit}
      isLoading={loginMutation.isPending}
      externalError={errorMessage}
    />
  )
}
