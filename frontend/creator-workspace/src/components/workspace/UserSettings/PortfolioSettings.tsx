import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import { Check, ChevronDown, ChevronUp, ExternalLink, Plus, Trash2 } from "lucide-react"
import type { ReactNode } from "react"
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { ProjectsService, UsersService, type UserPublic, type UserUpdateMe } from "@/client"
import type { AccentKey } from "@/components/accent-color-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { ImageField } from "@/components/ui/image-field"
import { TagInput } from "@/components/ui/tag-input"
import { AccentPicker } from "@/components/workspace/UserSettings/AccentPicker"
import { ColorModeControl, ThemePicker } from "@/components/workspace/UserSettings/ThemePicker"
import { useWorkspace } from "@/components/workspace-provider"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import {
  AVAILABILITY_OPTIONS,
  FORMAT_SUGGESTIONS,
  NICHE_SUGGESTIONS,
  PLATFORMS,
  blankToNull,
  sameList,
  imageField,
  tagArray,
  urlField,
} from "@/lib/profileFields"
import {
  type ColorMode,
  DEFAULT_THEME,
  THEME_KEYS,
  THEME_PRESETS,
  type ThemeKey,
} from "@/lib/themePresets"
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
    onSuccess: () => showSuccessToast("Saved. Changes can take up to a minute to show on your public page."),
    onError: handleError.bind(showErrorToast),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["currentUser"] }),
  })
}

function Section({
  id,
  title,
  description,
  children,
  form,
  saving,
  onSubmit,
}: {
  id?: string
  title: string
  description: string
  children: ReactNode
  form: UseFormReturn<any>
  saving: boolean
  onSubmit: () => void
}) {
  return (
    <section id={id} className="scroll-mt-20 rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">{description}</p>
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {children}
        <div className="flex gap-3 border-t pt-5">
          <LoadingButton
            type="submit"
            loading={saving}
            disabled={!form.formState.isDirty}
            
          >
            Save changes
          </LoadingButton>
          <Button
            type="button"
            variant="outline"
            
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
      id="card-about"
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
      id="card-make"
      title="What you make"
      description="Topics, formats and platforms. They appear under About, in the 'What I make' row."
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

// ─── Work style ─────────────────────────────────────────────────────────────

const workStyleSchema = z.object({
  work_steps: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Give the step a name").max(60, "At most 60 characters"),
        description: z.string().max(240, "At most 240 characters"),
      }),
    )
    .max(6),
  work_principles: tagArray(6, 40),
  work_tools: tagArray(12),
})
type WorkStyleData = z.infer<typeof workStyleSchema>

const stepRows = (u: UserPublic) =>
  (u.work_steps ?? []).map((s) => ({
    title: String(s.title ?? ""),
    description: String(s.description ?? ""),
  }))

function WorkStyleCard({ user }: { user: UserPublic }) {
  const save = useSaveProfile()
  const form = useForm<WorkStyleData>({
    resolver: zodResolver(workStyleSchema),
    mode: "onBlur",
    values: {
      work_steps: stepRows(user),
      work_principles: user.work_principles ?? [],
      work_tools: user.work_tools ?? [],
    },
  })
  const rows = useFieldArray({ control: form.control, name: "work_steps" })
  const { errors } = form.formState

  const normalise = (r: { title: string; description: string }[]) =>
    r.map((x) => ({ title: x.title.trim(), description: blankToNull(x.description) }))

  const onSubmit = form.handleSubmit((d) => {
    const patch: UserUpdateMe = {}
    const steps = normalise(d.work_steps)
    if (JSON.stringify(steps) !== JSON.stringify(normalise(stepRows(user)))) patch.work_steps = steps
    if (!sameList(d.work_principles, user.work_principles)) patch.work_principles = d.work_principles
    if (!sameList(d.work_tools, user.work_tools)) patch.work_tools = d.work_tools
    save.mutate(patch)
  })

  return (
    <Section
      id="card-approach"
      title="Work style"
      description="How you work. It appears on your page as 'How I work': your process steps, what you stand for, and the tools you use."
      form={form}
      saving={save.isPending}
      onSubmit={onSubmit}
    >
      <div className="space-y-3">
        <p className="text-sm font-medium">Process steps</p>
        {rows.fields.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No steps yet. For example: Discover, Script and plan, Shoot and edit, Publish and report.
          </p>
        )}
        {rows.fields.map((row, i) => (
          <div key={row.id} className="grid gap-2 rounded-lg border bg-muted/30 p-3 md:grid-cols-[auto_1fr_2fr_auto]">
            <span className="hidden pt-2 text-sm font-semibold text-muted-foreground md:block">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <Input
                aria-label={`Step ${i + 1} name`}
                maxLength={60}
                placeholder="Step name"
                {...form.register(`work_steps.${i}.title` as const)}
              />
              {errors.work_steps?.[i]?.title && (
                <p role="alert" className="mt-1 text-xs text-destructive">
                  {errors.work_steps[i]?.title?.message}
                </p>
              )}
            </div>
            <div>
              <Input
                aria-label={`Step ${i + 1} description`}
                maxLength={240}
                placeholder="What happens in this step (optional)"
                {...form.register(`work_steps.${i}.description` as const)}
              />
              {errors.work_steps?.[i]?.description && (
                <p role="alert" className="mt-1 text-xs text-destructive">
                  {errors.work_steps[i]?.description?.message}
                </p>
              )}
            </div>
            <div className="flex">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Move step ${i + 1} up`}
                disabled={i === 0}
                onClick={() => rows.move(i, i - 1)}
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Move step ${i + 1} down`}
                disabled={i === rows.fields.length - 1}
                onClick={() => rows.move(i, i + 1)}
              >
                <ChevronDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove step ${i + 1}`}
                onClick={() => rows.remove(i)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={rows.fields.length >= 6}
          onClick={() => rows.append({ title: "", description: "" })}
        >
          <Plus className="mr-1 size-4" /> Add step
        </Button>
        <span className="ml-3 text-xs text-muted-foreground">{rows.fields.length}/6</span>
      </div>

      <Field label="What you stand for" hint="Short principles, up to 6 (for example: Honest reviews).">
        <TagInput
          label="Principles"
          value={form.watch("work_principles")}
          onChange={(v) => form.setValue("work_principles", v, { shouldDirty: true })}
          max={6}
          maxLength={40}
          placeholder="Type a principle and press Enter"
        />
      </Field>

      <Field label="Tools you use" hint="Software, gear or platforms, up to 12.">
        <TagInput
          label="Tools"
          value={form.watch("work_tools")}
          onChange={(v) => form.setValue("work_tools", v, { shouldDirty: true })}
          max={12}
          placeholder="e.g. Premiere Pro, Figma"
        />
      </Field>
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
      id="card-services"
      title="Work list"
      description="What you do for clients. It appears on your page as 'What I do', next to your availability."
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

// ─── Look & feel ────────────────────────────────────────────────────────────

const isThemeKey = (v: string | null | undefined): v is ThemeKey =>
  !!v && (THEME_KEYS as string[]).includes(v)

const lookSchema = z.object({
  cover_image_url: imageField,
  avatar_url: imageField,
  theme: z.enum(THEME_KEYS as [ThemeKey, ...ThemeKey[]]),
  accent_color: z.string(), // "" = match the theme's accent
  color_mode: z.enum(["system", "light", "dark"]),
})
type LookData = z.infer<typeof lookSchema>

function LookCard({ user }: { user: UserPublic }) {
  const save = useSaveProfile()
  const savedTheme: ThemeKey = isThemeKey(user.theme) ? user.theme : DEFAULT_THEME
  const savedMode: ColorMode = user.color_mode === "light" || user.color_mode === "dark" ? user.color_mode : "system"
  const form = useForm<LookData>({
    resolver: zodResolver(lookSchema),
    mode: "onBlur",
    values: {
      cover_image_url: user.cover_image_url ?? "",
      avatar_url: user.avatar_url ?? "",
      theme: savedTheme,
      accent_color: user.accent_color ?? "",
      color_mode: savedMode,
    },
  })
  const { errors } = form.formState
  const cover = form.watch("cover_image_url")
  const avatar = form.watch("avatar_url")
  const theme = form.watch("theme")
  const accentValue = form.watch("accent_color")
  const mode = form.watch("color_mode")
  const themeAccent = THEME_PRESETS[theme].defaultAccent
  const effectiveAccent = (accentValue || themeAccent) as AccentKey

  const onSubmit = form.handleSubmit((d) => {
    const patch: UserUpdateMe = {}
    if (blankToNull(d.cover_image_url) !== (user.cover_image_url ?? null))
      patch.cover_image_url = blankToNull(d.cover_image_url)
    if (blankToNull(d.avatar_url) !== (user.avatar_url ?? null))
      patch.avatar_url = blankToNull(d.avatar_url)
    if (d.theme !== savedTheme) patch.theme = d.theme
    const accent = (d.accent_color || null) as UserUpdateMe["accent_color"]
    if (accent !== (user.accent_color ?? null)) patch.accent_color = accent
    if (d.color_mode !== savedMode) patch.color_mode = d.color_mode === "system" ? null : d.color_mode
    save.mutate(patch)
  })

  return (
    <Section
      id="card-look"
      title="Look & feel"
      description="Pick a theme for your page. Themes change colors, fonts and corner style, never the layout: every page has the same sections."
      form={form}
      saving={save.isPending}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <p className="text-sm font-medium" id="theme-label">
          Theme
        </p>
        <ThemePicker
          label="Theme"
          value={theme}
          accent={effectiveAccent}
          mode={mode as ColorMode}
          onChange={(k) => form.setValue("theme", k, { shouldDirty: true })}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Accent color</p>
        <AccentPicker
          label="Accent color"
          matchTheme={themeAccent}
          value={(accentValue || null) as AccentKey | null}
          onChange={(k) => form.setValue("accent_color", k ?? "", { shouldDirty: true })}
        />
        <p className="text-xs text-muted-foreground">
          Used for buttons, links and the glow. “Auto” uses the theme's own accent.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Light or dark</p>
        <ColorModeControl
          label="Default light or dark mode"
          value={mode as ColorMode}
          onChange={(m) => form.setValue("color_mode", m, { shouldDirty: true })}
        />
        <p className="text-xs text-muted-foreground">
          The mode your page starts in. Visitors can still switch with the toggle in the menu.
        </p>
      </div>

      <Field
        label="Cover image"
        hint="Wide image at the top of your page. Around 1600×600 works well."
        error={errors.cover_image_url?.message}
      >
        <ImageField
          kind="cover"
          label="Cover image"
          value={cover}
          onChange={(v) => form.setValue("cover_image_url", v, { shouldDirty: true, shouldValidate: true })}
          previewClassName="aspect-[8/3] w-56"
        />
      </Field>

      <Field
        label="Profile photo"
        hint="A square photo of you or your logo. The theme decides its corner shape."
        error={errors.avatar_url?.message}
      >
        <ImageField
          kind="avatar"
          label="Profile photo"
          value={avatar}
          onChange={(v) => form.setValue("avatar_url", v, { shouldDirty: true, shouldValidate: true })}
          previewClassName="size-24 rounded-full"
        />
      </Field>
    </Section>
  )
}

// ─── Page structure ─────────────────────────────────────────────────────────

function hasContactInfo(u: UserPublic) {
  return !!(u.contact_email || u.website || u.twitter || u.instagram || u.youtube || u.tiktok || u.media_kit_url)
}

/** The fixed sections every portfolio page has, with what is filled in. */
function StructureCard({ user }: { user: UserPublic }) {
  const { activeWorkspaceId } = useWorkspace()
  const { data: projects } = useQuery({
    queryKey: ["projects", activeWorkspaceId],
    queryFn: () => ProjectsService.readProjects({ skip: 0, limit: 1000 }),
  })
  const published = (projects?.data ?? []).filter((p) => p.platform_status === "Published")

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })

  const sections: { name: string; page: string; done: boolean; target: string | { to: string; tab?: string } }[] = [
    { name: "Home", page: "Name, headline, photo and cover", done: !!(user.headline && (user.avatar_url || user.cover_image_url)), target: "card-about" },
    { name: "About", page: "Your story, and what you make", done: !!(user.about || user.bio), target: "card-about" },
    { name: "Approach (Work style)", page: "Process steps, principles and tools", done: (user.work_steps?.length ?? 0) + (user.work_principles?.length ?? 0) + (user.work_tools?.length ?? 0) > 0, target: "card-approach" },
    { name: "Services (Work list)", page: "What you do for clients", done: (user.services?.length ?? 0) > 0, target: "card-services" },
    { name: "Work (Previous work)", page: "Your Published projects", done: published.length > 0, target: { to: "/projects" } },
    { name: "Brands", page: "Brands tied to published projects", done: published.some((p) => p.brand_id), target: { to: "/projects" } },
    { name: "Contact", page: "An email, social links or media kit", done: hasContactInfo(user), target: { to: "/settings", tab: "my-profile" } },
  ]

  return (
    <section className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Your page has these sections</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Every portfolio page has the same sections, in this order. Sections you haven't filled in show a short
        placeholder to visitors.
      </p>
      <ol className="divide-y rounded-lg border">
        {sections.map((s, i) => (
          <li key={s.name} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className="w-5 shrink-0 text-muted-foreground">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="font-medium">{s.name}</span>
              <span className="block text-xs text-muted-foreground">{s.page}</span>
            </span>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                s.done ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300" : "bg-muted text-muted-foreground",
              )}
            >
              {s.done && <Check className="size-3" />}
              {s.done ? "Filled in" : "Empty"}
            </span>
            {typeof s.target === "string" ? (
              <button
                type="button"
                onClick={() => jump(s.target as string)}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                Edit
              </button>
            ) : (
              <RouterLink
                to={s.target.to}
                search={s.target.tab ? { tab: s.target.tab } : undefined}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                Edit
              </RouterLink>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

// ─── tab ────────────────────────────────────────────────────────────────────

const PortfolioSettings = () => {
  const { user } = useAuth()
  if (!user) return null
  const profileUrl = user.username ? `${window.location.origin}/@${user.username}` : null

  return (
    <div className="max-w-3xl space-y-6">
      <section className="rounded-lg border bg-card p-6">
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

      <StructureCard user={user} />
      <AboutCard user={user} />
      <ContentCard user={user} />
      <WorkStyleCard user={user} />
      <ServicesCard user={user} />
      <LookCard user={user} />
    </div>
  )
}

export default PortfolioSettings
