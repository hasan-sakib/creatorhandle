import { useMutation } from "@tanstack/react-query"
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react"
import { useId, useRef, useState } from "react"

import { type ApiError, UploadsService } from "@/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isHttpUrl, isMediaPath } from "@/lib/profileFields"
import { cn } from "@/lib/utils"

const MAX_MB = 5 // keep in sync with MEDIA_MAX_UPLOAD_MB on the backend
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif"

type Kind = "avatar" | "cover" | "thumbnail"

interface ImageFieldProps {
  value: string
  onChange: (value: string) => void
  kind: Kind
  /** Accessible name, e.g. "Cover image". */
  label: string
  /** Classes for the preview box (size and shape). */
  previewClassName?: string
  placeholder?: string
}

function errorMessage(error: unknown): string {
  const detail = (error as ApiError | undefined)?.body as { detail?: unknown } | undefined
  if (typeof detail?.detail === "string") return detail.detail
  return "Upload failed. Please try again."
}

/**
 * Upload an image, or paste a link to one hosted elsewhere. Uploaded images are
 * resized and converted on the server and stored in our own storage.
 */
export function ImageField({ value, onChange, kind, label, previewClassName, placeholder }: ImageFieldProps) {
  const inputId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [clientError, setClientError] = useState("")
  const [broken, setBroken] = useState<string | null>(null)

  const upload = useMutation({
    mutationFn: (file: File) => UploadsService.uploadImage({ formData: { file, kind } }),
    onSuccess: (res) => {
      setClientError("")
      onChange(res.url)
    },
  })

  const pick = (file: File | undefined) => {
    if (!file) return
    setClientError("")
    if (!ACCEPT.split(",").includes(file.type)) {
      setClientError("Use a JPEG, PNG, WebP or GIF image.")
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setClientError(`That image is larger than ${MAX_MB} MB.`)
      return
    }
    upload.mutate(file)
  }

  const uploaded = isMediaPath(value)
  const previewable = uploaded || (value !== "" && isHttpUrl(value))
  const src = uploaded ? value : value.includes("://") ? value : `https://${value}`
  const message = clientError || (upload.isError ? errorMessage(upload.error) : "")

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-4">
        <div
          className={cn(
            "grid shrink-0 place-items-center overflow-hidden rounded-lg border bg-muted/40 text-muted-foreground",
            previewClassName ?? "size-24",
          )}
        >
          {upload.isPending ? (
            <Loader2 className="size-5 animate-spin" aria-label="Uploading" />
          ) : previewable && broken !== src ? (
            <img
              src={src}
              alt={`${label} preview`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setBroken(src)}
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon className="size-6" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 basis-56 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={upload.isPending}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4" />
              {value ? "Replace image" : "Upload image"}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
                <Trash2 className="size-4" />
                Remove
              </Button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              tabIndex={-1}
              aria-label={`Choose a file for ${label}`}
              onChange={(e) => {
                pick(e.target.files?.[0])
                e.target.value = "" // allow choosing the same file again
              }}
            />
          </div>

          {uploaded ? (
            <p className="text-xs text-muted-foreground">Uploaded image. JPEG, PNG, WebP or GIF, up to {MAX_MB} MB.</p>
          ) : (
            <div className="space-y-1">
              <label htmlFor={inputId} className="text-xs text-muted-foreground">
                Or paste a link to an image
              </label>
              <Input
                id={inputId}
                inputMode="url"
                value={value}
                placeholder={placeholder ?? "https://…"}
                onChange={(e) => onChange(e.target.value)}
              />
            </div>
          )}

          <p role="status" aria-live="polite" className={cn("min-h-4 text-xs text-destructive", !message && "sr-only")}>
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
