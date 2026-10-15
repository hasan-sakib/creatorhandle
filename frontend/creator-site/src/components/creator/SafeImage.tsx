import { type ReactNode, useState } from "react"

import { safeImageUrl } from "@/lib/safeUrl"
import { cn } from "@/lib/utils"

interface SafeImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  /** Shown when there is no image or it fails to load. */
  fallback: ReactNode
}

/** Renders an uploaded or http(s) image only; otherwise (or on error) the fallback. */
export function SafeImage({ src, alt, className, fallback }: SafeImageProps) {
  const safe = safeImageUrl(src)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!safe || failedSrc === safe) return <>{fallback}</>
  return (
    <img
      src={safe}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(safe)}
      className={cn("size-full object-cover", className)}
    />
  )
}
