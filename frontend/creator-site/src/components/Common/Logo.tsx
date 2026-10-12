import { AtSign } from "lucide-react"

import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "full" | "icon"
  className?: string
}

export function Logo({ variant = "full", className }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
      >
        <AtSign className="size-[18px]" strokeWidth={2.5} />
      </span>
      {variant === "full" && (
        <span className="font-display text-xl font-bold leading-none tracking-tight text-foreground">
          Creator<span className="text-primary">Handle</span>
        </span>
      )}
      {variant === "icon" && <span className="sr-only">CreatorHandle</span>}
    </span>
  )
}
