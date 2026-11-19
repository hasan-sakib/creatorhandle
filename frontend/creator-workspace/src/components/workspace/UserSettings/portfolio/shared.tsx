import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ReactNode } from "react"
import type { UseFormReturn } from "react-hook-form"

import { UsersService, type UserUpdateMe } from "@/client"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/lib/errors"
import type { AVAILABILITY_OPTIONS, PLATFORMS } from "@/lib/profileFields"

export type Platform = (typeof PLATFORMS)[number]
export type Availability = (typeof AVAILABILITY_OPTIONS)[number]["value"]

// ─── shared pieces ──────────────────────────────────────────────────────────

export function useSaveProfile() {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  return useMutation({
    mutationFn: (data: UserUpdateMe) =>
      UsersService.updateUserMe({ requestBody: data }),
    onSuccess: () =>
      showSuccessToast(
        "Saved. Changes can take up to a minute to show on your public page.",
      ),
    onError: handleError.bind(showErrorToast),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["currentUser"] }),
  })
}

export function Section({
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

export function Field({
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
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export const textareaClass =
  "flex min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-y"
