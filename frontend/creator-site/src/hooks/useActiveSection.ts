import { useEffect, useState } from "react"

/** The id of the section currently crossing the middle of the viewport. */
export function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join("|")

  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` is the stable form of `ids`
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    )
    for (const el of elements) observer.observe(el)
    return () => observer.disconnect()
  }, [key])

  return active
}
