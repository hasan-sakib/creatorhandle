import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { UserPublic, UserUpdateMe } from "@/client"
import { TagInput } from "@/components/ui/tag-input"
import {
  FORMAT_SUGGESTIONS,
  NICHE_SUGGESTIONS,
  PLATFORMS,
  sameList,
  tagArray,
} from "@/lib/profileFields"
import { cn } from "@/lib/utils"
import { Field, type Platform, Section, useSaveProfile } from "./shared"

// ─── 2. Content & niches ────────────────────────────────────────────────────

const contentSchema = z.object({
  niches: tagArray(10),
  content_formats: tagArray(10),
  platforms: z.array(z.enum(PLATFORMS)).max(10),
})
type ContentData = z.infer<typeof contentSchema>

export function ContentCard({ user }: { user: UserPublic }) {
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
    const next = platforms.includes(p)
      ? platforms.filter((x) => x !== p)
      : [...platforms, p]
    form.setValue("platforms", next, { shouldDirty: true })
  }

  const onSubmit = form.handleSubmit((d) => {
    const patch: UserUpdateMe = {}
    if (!sameList(d.niches, user.niches)) patch.niches = d.niches
    if (!sameList(d.content_formats, user.content_formats))
      patch.content_formats = d.content_formats
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
          onChange={(v) =>
            form.setValue("content_formats", v, { shouldDirty: true })
          }
          max={10}
          placeholder="e.g. Long videos, Shorts"
          suggestions={FORMAT_SUGGESTIONS}
        />
      </Field>
      <div className="space-y-1.5">
        <p className="text-sm font-medium" id="platforms-label">
          Platforms
        </p>
        <div
          role="group"
          aria-labelledby="platforms-label"
          className="flex flex-wrap gap-2"
        >
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
