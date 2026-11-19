import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { UserPublic, UserUpdateMe } from "@/client"
import { Input } from "@/components/ui/input"
import { TagInput } from "@/components/ui/tag-input"
import { blankToNull, sameList, tagArray } from "@/lib/profileFields"
import { Field, Section, textareaClass, useSaveProfile } from "./shared"

// ─── 1. About & identity ────────────────────────────────────────────────────

const aboutSchema = z.object({
  headline: z.string().max(120, "At most 120 characters"),
  location: z.string().max(100, "At most 100 characters"),
  languages: tagArray(8),
  about: z.string().max(2000, "At most 2000 characters"),
})
type AboutData = z.infer<typeof aboutSchema>

export function AboutCard({ user }: { user: UserPublic }) {
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
    if (blankToNull(d.headline) !== (user.headline ?? null))
      patch.headline = blankToNull(d.headline)
    if (blankToNull(d.location) !== (user.location ?? null))
      patch.location = blankToNull(d.location)
    if (!sameList(d.languages, user.languages)) patch.languages = d.languages
    if (blankToNull(d.about) !== (user.about ?? null))
      patch.about = blankToNull(d.about)
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
          <Input
            id="headline"
            maxLength={120}
            placeholder="What do you do?"
            {...form.register("headline")}
          />
        </Field>
        <Field
          label="Location"
          htmlFor="location"
          error={errors.location?.message}
        >
          <Input
            id="location"
            maxLength={100}
            placeholder="City, Country"
            {...form.register("location")}
          />
        </Field>
      </div>

      <Field
        label="Languages"
        error={errors.languages?.message as string | undefined}
      >
        <TagInput
          label="Languages"
          value={form.watch("languages")}
          onChange={(v) =>
            form.setValue("languages", v, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
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
        <p className="text-right text-xs text-muted-foreground">
          {about.length}/2000
        </p>
      </Field>
    </Section>
  )
}
