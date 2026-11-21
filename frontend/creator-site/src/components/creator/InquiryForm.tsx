import { useMutation } from "@tanstack/react-query"
import { CheckCircle2, Send } from "lucide-react"
import { type FormEvent, useId, useState } from "react"

import { ApiError, type InquiryCreate, PublicService } from "@/client"
import { useIsOwner } from "@/components/creator/owner-context"
import { Button } from "@/components/ui/button"

const BUDGETS: {
  value: NonNullable<InquiryCreate["budget"]>
  label: string
}[] = [
  { value: "under-500", label: "Under $500" },
  { value: "500-2k", label: "$500 – $2k" },
  { value: "2k-5k", label: "$2k – $5k" },
  { value: "5k-plus", label: "$5k+" },
  { value: "not-sure", label: "Not sure yet" },
]

const field =
  "w-full rounded-tile border border-border bg-background/70 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60"

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return "Too many messages from your connection. Please try again later."
    }
    if (error.status === 422) {
      return "Please check the form: a valid email and a message of at least 10 characters are required."
    }
    if (error.status === 404) return "This page is no longer available."
  }
  return "Something went wrong. Please try again."
}

export function InquiryForm({
  username,
  name,
}: {
  username: string
  name: string
}) {
  const id = useId()
  const isOwner = useIsOwner()
  const [budget, setBudget] = useState<InquiryCreate["budget"]>(null)

  const mutation = useMutation({
    mutationFn: (requestBody: InquiryCreate) =>
      PublicService.createInquiry({ username, requestBody }),
  })

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (mutation.isPending) return
    const form = new FormData(e.currentTarget)
    const text = (key: string) => String(form.get(key) ?? "").trim()
    mutation.mutate({
      name: text("name"),
      email: text("email"),
      company: text("company") || null,
      budget,
      message: text("message"),
      website: text("website") || null,
    })
  }

  if (mutation.isSuccess) {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-inner border border-border bg-background/70 p-5"
      >
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent-text" />
        <div>
          <p className="font-medium">Message sent</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {name} will reply to the email address you gave.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label
          className="grid gap-1.5 text-sm font-medium"
          htmlFor={`${id}-name`}
        >
          Your name
          <input
            id={`${id}-name`}
            name="name"
            required
            maxLength={100}
            autoComplete="name"
            className={field}
          />
        </label>
        <label
          className="grid gap-1.5 text-sm font-medium"
          htmlFor={`${id}-email`}
        >
          Email
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            required
            maxLength={255}
            autoComplete="email"
            className={field}
          />
        </label>
        <label
          className="grid gap-1.5 text-sm font-medium"
          htmlFor={`${id}-company`}
        >
          <span>
            Company or brand{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </span>
          <input
            id={`${id}-company`}
            name="company"
            maxLength={100}
            autoComplete="organization"
            className={field}
          />
        </label>
        <fieldset className="grid gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">
            Budget{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {BUDGETS.map((b) => (
              <button
                key={b.value}
                type="button"
                aria-pressed={budget === b.value}
                onClick={() => setBudget(budget === b.value ? null : b.value)}
                className="rounded-pill border border-border bg-background/70 px-3 py-1.5 text-xs transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                {b.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <label
        className="grid gap-1.5 text-sm font-medium"
        htmlFor={`${id}-message`}
      >
        Message
        <textarea
          id={`${id}-message`}
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          placeholder="What are you planning, and when?"
          className={field}
        />
      </label>

      {/* Honeypot: hidden from people and screen readers; bots fill it in */}
      <div aria-hidden="true" className="sr-only">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(mutation.error)}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          size="lg"
          className="rounded-pill px-6"
          disabled={mutation.isPending || isOwner}
        >
          <Send className="size-4" />
          {mutation.isPending ? "Sending…" : "Send message"}
        </Button>
        {isOwner && (
          <p className="text-sm text-muted-foreground">
            This is your page: visitors' messages arrive in your dashboard
            inbox.
          </p>
        )}
      </div>
    </form>
  )
}
