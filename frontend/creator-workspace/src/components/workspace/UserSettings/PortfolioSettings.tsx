import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ExternalLink, Plus, Trash2 } from "lucide-react"
import { type ReactNode, useState } from "react"
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { UsersService, type UserPublic, type UserUpdateMe } from "@/client"
import type { AccentKey } from "@/components/accent-color-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { TagInput } from "@/components/ui/tag-input"
import { AccentPicker } from "@/components/workspace/UserSettings/AccentPicker"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import {
  AVAILABILITY_OPTIONS,
  FORMAT_SUGGESTIONS,
  NICHE_SUGGESTIONS,
  PLATFORMS,
  blankToNull,
  isHttpUrl,
  sameList,
  tagArray,
  urlField,
} from "@/lib/profileFields"
import { cn } from "@/lib/utils"
import { handleError } from "@/utils"

type Platform = (typeof PLATFORMS)[number]
type Availability = (typeof AVAILABILITY_OPTIONS)[number]["value"]

// ─── shared pieces ──────────────────────────────────────────────────────────

function useSaveProfile() {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  return useMutation({
    mutationFn: (data: UserUpdateMe) => UsersService.updateUserMe({ requestBody: data }),
    onSuccess: () => showSuccessToast("Saved"),
    onError: handleError.bind(showErrorToast),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["currentUser"] }),
  })
}

function Section({
  title,
  description,
  children,
  form,
  saving,
  onSubmit,
}: {
  title: string
  description: string
  children: ReactNode
  form: UseFormReturn<any>
  saving: boolean
  onSubmit: () => void
}) {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">{description}</p>
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {children}
        <div className="flex gap-3 border-t pt-5">
          <LoadingButton
            type="submit"
            loading={saving}
            disabled={!form.formState.isDirty}
            className="rounded-full"
          >
            Save changes
          </LoadingButton>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={!form.formState.isDirty || saving}
            onClick={() => form.reset()}
          >
            Discard
          </Button>
        </div>
      </form>
    </section>
  )
}

function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  error?: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

const textareaClass =
  "flex min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-y"

function ImagePreview({ url, alt, className }: { url: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null)
  if (!url || !isHttpUrl(url)) return null
  const src = url.includes("://") ? url : `https://${url}`
  if (failed === src) {
    return <p className="text-xs text-muted-foreground">That image could not be loaded.</p>
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(src)}
      className={cn("rounded-lg border object-cover", className)}
    />
  )
}

// ─── 1. About & identity ────────────────────────────────────────────────────

const aboutSchema = z.object({
  headline: z.string().max(120, "At most 120 characters"),
  location: z.string().max(100, "At most 100 characters"),
  languages: tagArray(8),
  about: z.string().max(2000, "At most 2000 characters"),
})
type AboutData = z.infer<typeof aboutSchema>

function AboutCard({ user }: { user: UserPublic }) {
  const save = useSaveProfile()
  const form = useForm<AboutData>({
    resolver: zodResolver(aboutSchema),
    mode: "onBlur",
    values: {
      headline: user.headline ?? "",
      location: user.location ?? "",
      languages: user.languages ?? [],
      about: user.about ?? "",
    },
  })
  const { errors } = form.formState
  const about = form.watch("about")

  const onSubmit = form.handleSubmit((d) => {
    const patch: UserUpdateMe = {}
    if (blankToNull(d.headline) !== (user.headline ?? null)) patch.headline = blankToNull(d.headline)
    if (blankToNull(d.location) !== (user.location ?? null)) patch.location = blankToNull(d.location)
    if (!sameList(d.languages, user.languages)) patch.languages = d.languages
    if (blankToNull(d.about) !== (user.about ?? null)) patch.about = blankToNull(d.about)
    save.mutate(patch)
  })

  return (
    <Section
      title="About & identity"
      description="Who you are and what you do. This is the first thing visitors read."
      form={form}
      saving={save.isPending}
      onSubmit={onSubmit}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Headline"
          htmlFor="headline"
          hint="One line, e.g. “Tech YouTuber & gadget reviewer”"
          error={errors.headline?.message}
        >
          <Input id="headline" maxLength={120} placeholder="What do you do?" {...form.register("headline")} />
        </Field>
        <Field label="Location" htmlFor="location" error={errors.location?.message}>
          <Input id="location" maxLength={100} placeholder="City, Country" {...form.register("location")} />
        </Field>
      </div>

      <Field label="Languages" error={errors.languages?.message as string | undefined}>
        <TagInput
          label="Languages"
          value={form.watch("languages")}
          onChange={(v) => form.setValue("languages", v, { shouldDirty: true, shouldValidate: true })}
          max={8}
          placeholder="Type a language and press Enter"
        />
      </Field>

      <Field
        label="About me"
        htmlFor="about"
        hint="Tell brands and fans your story, your style and what they can expect. Line breaks are kept."
        error={errors.about?.message}
      >
        <textarea
          id="about"
          className={textareaClass}
          maxLength={2000}
          rows={6}
          placeholder="Write a few short paragraphs about yourself…"
          {...form.register("about")}
        />
        <p className="text-right text-xs text-muted-foreground">{about.length}/2000</p>
      </Field>
    </Section>
  )
}

// ─── 2. Content & niches ────────────────────────────────────────────────────

const contentSchema = z.object({
  niches: tagArray(10),
  content_formats: tagArray(10),
  platforms: z.array(z.enum(PLATFORMS)).max(10),
})
type ContentData = z.infer<typeof contentSchema>

function ContentCard({ user }: { user: UserPublic }) {
  const save = useSaveProfile()
  const form = useForm<ContentData>({
    resolver: zodResolver(contentSchema),
    values: {
      niches: user.niches ?? [],
      content_formats: user.content_formats ?? [],
      platforms: (user.platforms ?? []).filter((p): p is Platform =>
        (PLATFORMS as readonly string[]).includes(p),
      ),
    },
  })
  const platforms = form.watch("platforms")

  const togglePlatform = (p: Platform) => {
    const next = platforms.includes(p) ? platforms.filter((x) => x !== p) : [...platforms, p]
    form.setValue("platforms", next, { shouldDirty: true })
  }

  const onSubmit = form.handleSubmit((d) => {
    const patch: UserUpdateMe = {}
    if (!sameList(d.niches, user.niches)) patch.niches = d.niches
    if (!sameList(d.content_formats, user.content_formats)) patch.content_formats = d.content_formats
    if (!sameList(d.platforms, user.platforms)) patch.platforms = d.platforms
    save.mutate(patch)
  })

  return (
    <Section
      title="Content & niches"
      description="What kind of content you make and where you publish it."
      form={form}
      saving={save.isPending}
      onSubmit={onSubmit}
    >
      <Field label="Niches" hint="Topics you cover, up to 10.">
        <TagInput
          label="Niches"
          value={form.watch("niches")}
          onChange={(v) => form.setValue("niches", v, { shouldDirty: true })}
          max={10}
          placeholder="e.g. Tech, Gadget reviews"
          suggestions={NICHE_SUGGESTIONS}
        />
      </Field>
      <Field label="Content formats" hint="How you make content, up to 10.">
        <TagInput
          label="Content formats"
          value={form.watch("content_formats")}
          onChange={(v) => form.setValue("content_formats", v, { shouldDirty: true })}
          max={10}
          placeholder="e.g. Long videos, Shorts"
          suggestions={FORMAT_SUGGESTIONS}
        />
      </Field>
      <div className="space-y-1.5">
        <p className="text-sm font-medium" id="platforms-label">
          Platforms
        </p>
        <div role="group" aria-labelledby="platforms-label" className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const on = platforms.includes(p)
            return (
              <button
                key={p}
                type="button"
                aria-pressed={on}
                onClick={() => togglePlatform(p)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:border-primary/50",
                )}
              >
                {p}
              </button>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

// ─── 3. Services & availability ─────────────────────────────────────────────

const servicesSchema = z.object({
  availability: z.enum(["", "open", "limited", "closed"]),
  services: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Give the service a name").max(60, "At most 60 characters"),
        description: z.string().max(200, "At most 200 characters"),
      }),
    )
    .max(8),
  media_kit_url: urlField,
})
type ServicesData = z.infer<typeof servicesSchema>

function ServicesCard({ user }: { user: UserPublic }) {
  const save = useSaveProfile()
  const toRows = (u: UserPublic) =>
    (u.services ?? []).map((s) => ({
      title: String(s.title ?? ""),
      description: String(s.description ?? ""),
    }))
  const form = useForm<ServicesData>({
    resolver: zodResolver(servicesSchema),
    mode: "onBlur",
    values: {
      availability: (user.availability as Availability | null) ?? "",
      services: toRows(user),
      media_kit_url: user.media_kit_url ?? "",
    },
  })
  const rows = useFieldArray({ control: form.control, name: "services" })
  const { errors } = form.formState
  const availability = form.watch("availability")

  const onSubmit = form.handleSubmit((d) => {
    const patch: UserUpdateMe = {}
    if ((d.availability || null) !== (user.availability ?? null))
      patch.availability = (d.availability || null) as Availability | null
    const services = d.services.map((s) => ({
      title: s.title.trim(),
      description: blankToNull(s.description),
    }))
    if (JSON.stringify(services) !== JSON.stringify(toRows(user).map((s) => ({ title: s.title, description: blankToNull(s.description) }))))
      patch.services = services
    if (blankToNull(d.media_kit_url) !== (user.media_kit_url ?? null))
      patch.media_kit_url = blankToNull(d.media_kit_url)
    save.mutate(patch)
  })

  return (
    <Section
      title="Services & availability"
      description="What brands can hire you for, and whether you are taking new work."
      form={form}
      saving={save.isPending}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <p className="text-sm font-medium" id="availability-label">
          Availability
        </p>
        <div role="radiogroup" aria-labelledby="availability-label" className="grid gap-2 sm:grid-cols-3">
          {AVAILABILITY_OPTIONS.map((o) => {
            const on = availability === o.value
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() =>
                  form.setValue("availability", on ? "" : o.value, { shouldDirty: true })
                }
                className={cn(
                  "rounded-lg border p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on ? "border-primary bg-primary/10" : "hover:border-primary/50",
                )}
              >
                <span className="block font-medium">{o.label}</span>
                <span className="text-xs text-muted-foreground">{o.hint}</span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">Click the selected option again to hide the badge.</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Services you offer</p>
        {rows.fields.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No services yet. Add things like “Sponsored video” or “UGC content”.
          </p>
        )}
        {rows.fields.map((row, i) => (
          <div key={row.id} className="grid gap-2 rounded-lg border bg-muted/30 p-3 md:grid-cols-[1fr_2fr_auto]">
            <div>
              <Input
                aria-label={`Service ${i + 1} name`}
                maxLength={60}
                placeholder="Service name"
                {...form.register(`services.${i}.title` as const)}
              />
              {errors.services?.[i]?.title && (
                <p role="alert" className="mt-1 text-xs text-destructive">
                  {errors.services[i]?.title?.message}
                </p>
              )}
            </div>
            <div>
              <Input
                aria-label={`Service ${i + 1} description`}
                maxLength={200}
                placeholder="Short description (optional)"
                {...form.register(`services.${i}.description` as const)}
              />
              {errors.services?.[i]?.description && (
                <p role="alert" className="mt-1 text-xs text-destructive">
                  {errors.services[i]?.description?.message}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove service ${i + 1}`}
              onClick={() => rows.remove(i)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={rows.fields.length >= 8}
          onClick={() => rows.append({ title: "", description: "" })}
        >
          <Plus className="mr-1 size-4" /> Add service
        </Button>
        <span className="ml-3 text-xs text-muted-foreground">{rows.fields.length}/8</span>
      </div>

      <Field
        label="Media kit link"
        htmlFor="media_kit_url"
        hint="A link to your media kit or rate card (Google Drive, Notion, PDF…)."
        error={errors.media_kit_url?.message}
      >
        <Input id="media_kit_url" inputMode="url" placeholder="https://…" {...form.register("media_kit_url")} />
      </Field>
    </Section>
  )
}

// ─── 4. Look ────────────────────────────────────────────────────────────────

const lookSchema = z.object({
  cover_image_url: urlField,
  avatar_url: urlField,
  accent_color: z.string(),
})
type LookData = z.infer<typeof lookSchema>

function LookCard({ user }: { user: UserPublic }) {
  const save = useSaveProfile()
  const form = useForm<LookData>({
    resolver: zodResolver(lookSchema),
    mode: "onBlur",
    values: {
      cover_image_url: user.cover_image_url ?? "",
      avatar_url: user.avatar_url ?? "",
      accent_color: user.accent_color ?? "teal",
    },
  })
  const { errors } = form.formState
  const cover = form.watch("cover_image_url")
  const avatar = form.watch("avatar_url")

  const onSubmit = form.handleSubmit((d) => {
    const patch: UserUpdateMe = {}
    if (blankToNull(d.cover_image_url) !== (user.cover_image_url ?? null))
      patch.cover_image_url = blankToNull(d.cover_image_url)
    if (blankToNull(d.avatar_url) !== (user.avatar_url ?? null))
      patch.avatar_url = blankToNull(d.avatar_url)
    if (d.accent_color !== (user.accent_color ?? "teal"))
      patch.accent_color = d.accent_color as UserUpdateMe["accent_color"]
    save.mutate(patch)
  })

  return (
    <Section
      title="Look & feel"
      description="Images and the accent color of your public page. Paste links to images you host (your site, a CDN, a public photo)."
      form={form}
      saving={save.isPending}
      onSubmit={onSubmit}
    >
      <Field
        label="Cover image link"
        htmlFor="cover_image_url"
        hint="Wide image shown at the top of your page, around 1600×600 works well."
        error={errors.cover_image_url?.message}
      >
        <Input id="cover_image_url" inputMode="url" placeholder="https://…/cover.jpg" {...form.register("cover_image_url")} />
        <ImagePreview url={cover} alt="Cover preview" className="mt-2 aspect-[8/3] w-full max-w-md" />
      </Field>

      <Field
        label="Profile photo link"
        htmlFor="avatar_url"
        hint="Square photo of you or your logo."
        error={errors.avatar_url?.message}
      >
        <Input id="avatar_url" inputMode="url" placeholder="https://…/me.jpg" {...form.register("avatar_url")} />
        <ImagePreview url={avatar} alt="Profile photo preview" className="mt-2 size-20 rounded-full" />
      </Field>

      <div className="space-y-2">
        <p className="text-sm font-medium" id="accent-label">
          Accent color
        </p>
        <AccentPicker
          label="Accent color"
          value={form.watch("accent_color") as AccentKey}
          onChange={(k) => form.setValue("accent_color", k, { shouldDirty: true })}
        />
        <p className="text-xs text-muted-foreground">
          Used for buttons, highlights and the background glow on your public page.
        </p>
      </div>
    </Section>
  )
}

// ─── tab ────────────────────────────────────────────────────────────────────

const PortfolioSettings = () => {
  const { user } = useAuth()
  if (!user) return null
  const profileUrl = user.username ? `${window.location.origin}/@${user.username}` : null

  return (
    <div className="max-w-3xl space-y-6">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Your public portfolio</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Visitors see your profile, the niches and services you fill in below, your{" "}
          <strong>Published</strong> projects (featured first) and the brands tied to them. Planning
          work, tasks, brand notes and brand contacts are never shown.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          {profileUrl && user.is_published ? (
            <a
              href={profileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              View your public page <ExternalLink className="size-3.5" />
            </a>
          ) : (
            <span className="text-muted-foreground">
              {profileUrl
                ? "Your page is not live yet. Publish it from the My profile tab."
                : "Set a public handle in the My profile tab first."}
            </span>
          )}
        </div>
      </section>

      <AboutCard user={user} />
      <ContentCard user={user} />
      <ServicesCard user={user} />
      <LookCard user={user} />
    </div>
  )
}

export default PortfolioSettings
