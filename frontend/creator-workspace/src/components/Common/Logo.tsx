import { Link } from "@tanstack/react-router"
import { AtSign } from "lucide-react"

import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "full" | "icon" | "responsive"
  className?: string
  asLink?: boolean
}

function Mark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground",
        className,
      )}
    >
      <AtSign className="size-[18px]" strokeWidth={2.5} />
    </span>
  )
}

const wordmark = "text-[17px] font-semibold leading-none tracking-tight text-foreground"

export function Logo({
  variant = "full",
  className,
  asLink = true,
}: LogoProps) {
  const content =
    variant === "icon" ? (
      <span className={cn("flex items-center", className)}>
        <Mark />
        <span className="sr-only">CreatorHandle</span>
      </span>
    ) : variant === "responsive" ? (
      <>
        <span className="flex items-center gap-2.5 group-data-[collapsible=icon]:hidden">
          <Mark />
          <span className={wordmark}>CreatorHandle</span>
        </span>
        <span className="hidden items-center group-data-[collapsible=icon]:flex">
          <Mark />
        </span>
      </>
    ) : (
      <span className={cn("flex items-center gap-2.5", className)}>
        <Mark />
        <span className={wordmark}>CreatorHandle</span>
      </span>
    )

  if (!asLink) {
    return content
  }

  return (
    <Link to="/" aria-label="CreatorHandle home">
      {content}
    </Link>
  )
}
