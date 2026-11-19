import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"

import type { UserPublic, UserUpdateMe } from "@/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TagInput } from "@/components/ui/tag-input"
import { blankToNull, sameList, tagArray } from "@/lib/profileFields"
import { Field, Section, useSaveProfile } from "./shared"

// ─── Work style ─────────────────────────────────────────────────────────────

const workStyleSchema = z.object({
  work_steps: z
    .array(
      z.object({
        title: z
          .string()
          .trim()
          .min(1, "Give the step a name")
          .max(60, "At most 60 characters"),
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

export function WorkStyleCard({ user }: { user: UserPublic }) {
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
    r.map((x) => ({
      title: x.title.trim(),
      description: blankToNull(x.description),
    }))

  const onSubmit = form.handleSubmit((d) => {
    const patch: UserUpdateMe = {}
    const steps = normalise(d.work_steps)
    if (JSON.stringify(steps) !== JSON.stringify(normalise(stepRows(user))))
      patch.work_steps = steps
    if (!sameList(d.work_principles, user.work_principles))
      patch.work_principles = d.work_principles
    if (!sameList(d.work_tools, user.work_tools))
      patch.work_tools = d.work_tools
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
            No steps yet. For example: Discover, Script and plan, Shoot and
            edit, Publish and report.
          </p>
        )}
        {rows.fields.map((row, i) => (
          <div
            key={row.id}
            className="grid gap-2 rounded-lg border bg-muted/30 p-3 md:grid-cols-[auto_1fr_2fr_auto]"
          >
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
        <span className="ml-3 text-xs text-muted-foreground">
          {rows.fields.length}/6
        </span>
      </div>

      <Field
        label="What you stand for"
        hint="Short principles, up to 6 (for example: Honest reviews)."
      >
        <TagInput
          label="Principles"
          value={form.watch("work_principles")}
          onChange={(v) =>
            form.setValue("work_principles", v, { shouldDirty: true })
          }
          max={6}
          maxLength={40}
          placeholder="Type a principle and press Enter"
        />
      </Field>

      <Field
        label="Tools you use"
        hint="Software, gear or platforms, up to 12."
      >
        <TagInput
          label="Tools"
          value={form.watch("work_tools")}
          onChange={(v) =>
            form.setValue("work_tools", v, { shouldDirty: true })
          }
          max={12}
          placeholder="e.g. Premiere Pro, Figma"
        />
      </Field>
    </Section>
  )
}
