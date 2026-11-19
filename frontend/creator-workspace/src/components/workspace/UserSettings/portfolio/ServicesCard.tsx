import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"

import type { UserPublic, UserUpdateMe } from "@/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AVAILABILITY_OPTIONS,
  blankToNull,
  urlField,
} from "@/lib/profileFields"
import { cn } from "@/lib/utils"
import { type Availability, Field, Section, useSaveProfile } from "./shared"

// ─── 3. Services & availability ─────────────────────────────────────────────

const servicesSchema = z.object({
  availability: z.enum(["", "open", "limited", "closed"]),
  services: z
    .array(
      z.object({
        title: z
          .string()
          .trim()
          .min(1, "Give the service a name")
          .max(60, "At most 60 characters"),
        description: z.string().max(200, "At most 200 characters"),
      }),
    )
    .max(8),
  media_kit_url: urlField,
})
type ServicesData = z.infer<typeof servicesSchema>

export function ServicesCard({ user }: { user: UserPublic }) {
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
    if (
      JSON.stringify(services) !==
      JSON.stringify(
        toRows(user).map((s) => ({
          title: s.title,
          description: blankToNull(s.description),
        })),
      )
    )
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
        <div
          role="radiogroup"
          aria-labelledby="availability-label"
          className="grid gap-2 sm:grid-cols-3"
        >
          {AVAILABILITY_OPTIONS.map((o) => {
            const on = availability === o.value
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() =>
                  form.setValue("availability", on ? "" : o.value, {
                    shouldDirty: true,
                  })
                }
                className={cn(
                  "rounded-lg border p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on
                    ? "border-primary bg-primary/10"
                    : "hover:border-primary/50",
                )}
              >
                <span className="block font-medium">{o.label}</span>
                <span className="text-xs text-muted-foreground">{o.hint}</span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Click the selected option again to hide the badge.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Services you offer</p>
        {rows.fields.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No services yet. Add things like “Sponsored video” or “UGC content”.
          </p>
        )}
        {rows.fields.map((row, i) => (
          <div
            key={row.id}
            className="grid gap-2 rounded-lg border bg-muted/30 p-3 md:grid-cols-[1fr_2fr_auto]"
          >
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
        <span className="ml-3 text-xs text-muted-foreground">
          {rows.fields.length}/8
        </span>
      </div>

      <Field
        label="Media kit link"
        htmlFor="media_kit_url"
        hint="A link to your media kit or rate card (Google Drive, Notion, PDF…)."
        error={errors.media_kit_url?.message}
      >
        <Input
          id="media_kit_url"
          inputMode="url"
          placeholder="https://…"
          {...form.register("media_kit_url")}
        />
      </Field>
    </Section>
  )
}
