import { Appearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"

interface AuthLayoutProps {
  children: React.ReactNode
}

/** Centered card on a quiet background, like a typical account sign-in page. */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <div className="flex justify-end p-4">
        <Appearance />
      </div>
      <div className="flex flex-1 items-start justify-center px-4 pb-16 pt-4 sm:items-center sm:pt-0">
        <div className="w-full max-w-[400px]">
          <div className="mb-6 flex justify-center">
            <Logo variant="full" asLink={false} />
          </div>
          <div className="rounded-xl border bg-card p-6 sm:p-8">{children}</div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} CreatorHandle
          </p>
        </div>
      </div>
    </div>
  )
}
