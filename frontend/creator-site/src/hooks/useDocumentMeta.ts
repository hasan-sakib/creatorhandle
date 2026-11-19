import { useEffect } from "react"

/** Sets the tab title and meta description while mounted, then restores them. */
export function useDocumentMeta(title: string, description?: string | null) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title

    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    )
    const previousDescription = meta?.content
    if (description) {
      if (!meta) {
        meta = document.createElement("meta")
        meta.name = "description"
        document.head.appendChild(meta)
      }
      meta.content = description
    }

    return () => {
      document.title = previousTitle
      if (meta && previousDescription !== undefined)
        meta.content = previousDescription
    }
  }, [title, description])
}
