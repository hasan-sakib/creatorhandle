import { Link } from "@tanstack/react-router"

import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import icon from "/assets/images/fastapi-icon.svg"
import iconLight from "/assets/images/fastapi-icon-light.svg"

interface LogoProps {
  variant?: "full" | "icon" | "responsive"
  className?: string
  asLink?: boolean
}

export function Logo({
  variant = "full",
  className,
  asLink = true,
}: LogoProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const iconSrc = isDark ? iconLight : icon

  const iconImg = (
    <img src={iconSrc} alt="CreatorHandle" className="size-5 shrink-0" />
  )

  const fullContent = (
    <span className={cn("flex items-center gap-3", className)}>
      <img src={iconSrc} alt="CreatorHandle" className="h-9 w-9 shrink-0" />
      <span className="font-bold text-[#009688] text-2xl leading-none tracking-tight">
        CreatorHandle
      </span>
    </span>
  )

  const content =
    variant === "icon" ? (
      <span className={cn("flex items-center", className)}>{iconImg}</span>
    ) : variant === "responsive" ? (
      <>
        <span className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          {iconImg}
          <span className="font-semibold text-[#009688] text-base leading-none">
            CreatorHandle
          </span>
        </span>
        <span className="hidden group-data-[collapsible=icon]:flex items-center">
          {iconImg}
        </span>
      </>
    ) : (
      fullContent
    )

  if (!asLink) {
    return content
  }

  return <Link to="/">{content}</Link>
}
