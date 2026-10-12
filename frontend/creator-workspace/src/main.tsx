import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { ApiError, OpenAPI } from "./client"
import { AccentColorProvider } from "./components/accent-color-provider"
import { ThemeProvider } from "./components/theme-provider"
import { ACTIVE_WORKSPACE_KEY } from "./components/workspace-provider"
import { Toaster } from "./components/ui/sonner"
import "./index.css"
import { routeTree } from "./routeTree.gen"

OpenAPI.BASE = import.meta.env.VITE_API_URL ?? ""
OpenAPI.TOKEN = async () => {
  return localStorage.getItem("access_token") || ""
}
OpenAPI.HEADERS = async () => {
  return { "X-Workspace-Id": localStorage.getItem(ACTIVE_WORKSPACE_KEY) || "" }
}

const handleApiError = (error: Error) => {
  // 403 is now an expected, normal response (e.g. insufficient workspace
  // permission) — only an actual invalid/expired token should log the user out.
  if (error instanceof ApiError && error.status === 401) {
    localStorage.removeItem("access_token")
    window.location.href = `${import.meta.env.BASE_URL}login`
  }
}
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleApiError,
  }),
  mutationCache: new MutationCache({
    onError: handleApiError,
  }),
})

const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL.replace(/\/$/, ""),
})
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AccentColorProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <Toaster richColors closeButton />
          </QueryClientProvider>
        </AccentColorProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
