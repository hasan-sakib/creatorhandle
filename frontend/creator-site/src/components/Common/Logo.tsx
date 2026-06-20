import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "full" | "icon"
  className?: string
}

export function Logo({ variant = "full", className }: LogoProps) {
  const content =
    variant === "icon" ? (
      <span className={cn("flex items-center", className)}>
        <span className="font-bold text-[#009688] text-2xl leading-none tracking-tight">CH</span>
      </span>
    ) : (
      <span className={cn("flex items-center gap-3", className)}>
        <span className="font-bold text-[#009688] text-2xl leading-none tracking-tight">
          CreatorHandle
        </span>
      </span>
    )

  return content
}
