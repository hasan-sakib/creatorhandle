import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  Archive,
  ArchiveRestore,
  ArrowRightCircle,
  Inbox as InboxIcon,
  Mail,
  MailOpen,
  Trash2,
} from "lucide-react"
import { Suspense, useState } from "react"

import { InquiriesService, type InquiryPublic } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PendingItems from "@/components/workspace/Pending/PendingItems"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import {
  type InquiryStatus,
  inquiriesQueryKey,
  inquiriesQueryOptions,
} from "@/hooks/useInquiries"
import { handleError } from "@/lib/errors"

export const Route = createFileRoute("/_layout/inbox")({
  component: Inbox,
  head: () => ({
    meta: [{ title: "Inbox - CreatorHandle" }],
  }),
})

type View = "inbox" | "archived" | "converted"

const VIEWS: Record<View, InquiryStatus[]> = {
  inbox: ["new", "read"],
  archived: ["archived"],
  converted: ["converted"],
}

const BUDGET_LABELS: Record<string, string> = {
  "under-500": "Under $500",
  "500-2k": "$500 – $2k",
  "2k-5k": "$2k – $5k",
  "5k-plus": "$5k+",
  "not-sure": "Budget not sure",
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

function InquiryCard({ inquiry }: { inquiry: InquiryPublic }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: inquiriesQueryKey })

  const setStatus = useMutation({
    mutationFn: (status: "new" | "read" | "archived") =>
      InquiriesService.updateInquiry({
        id: inquiry.id,
        requestBody: { status },
      }),
    onError: handleError.bind(showErrorToast),
    onSettled: refresh,
  })

  const remove = useMutation({
    mutationFn: () => InquiriesService.deleteInquiry({ id: inquiry.id }),
    onSuccess: () => showSuccessToast("Inquiry deleted"),
    onError: handleError.bind(showErrorToast),
    onSettled: refresh,
  })

  const convert = useMutation({
    mutationFn: () => InquiriesService.convertInquiry({ id: inquiry.id }),
    onSuccess: () => {
      showSuccessToast("Project created from the inquiry")
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      navigate({ to: "/projects" })
    },
    onError: handleError.bind(showErrorToast),
    onSettled: refresh,
  })

  const busy = setStatus.isPending || remove.isPending || convert.isPending
  const isNew = inquiry.status === "new"
  const replySubject = encodeURIComponent(
    `Re: your message${inquiry.company ? ` (${inquiry.company})` : ""}`,
  )

  return (
    <li
      className={`rounded-xl border bg-card p-5 ${isNew ? "border-primary/40" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{inquiry.name}</h3>
            {inquiry.company && (
              <span className="text-sm text-muted-foreground">
                · {inquiry.company}
              </span>
            )}
            {isNew && <Badge>New</Badge>}
            {inquiry.budget && (
              <Badge variant="outline">
                {BUDGET_LABELS[inquiry.budget] ?? inquiry.budget}
              </Badge>
            )}
          </div>
          <a
            href={`mailto:${inquiry.email}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            {inquiry.email}
          </a>
        </div>
        {inquiry.created_at && (
          <time
            dateTime={inquiry.created_at}
            className="text-xs text-muted-foreground"
          >
            {dateFormat.format(new Date(inquiry.created_at))}
          </time>
        )}
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
        {inquiry.message}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <a href={`mailto:${inquiry.email}?subject=${replySubject}`}>
            <Mail /> Reply
          </a>
        </Button>
        {inquiry.status === "converted" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate({ to: "/projects" })}
          >
            <ArrowRightCircle /> View projects
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => convert.mutate()}
            >
              <ArrowRightCircle /> Convert to project
            </Button>
            {inquiry.status === "archived" ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => setStatus.mutate("read")}
              >
                <ArchiveRestore /> Move to inbox
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setStatus.mutate(isNew ? "read" : "new")}
                >
                  {isNew ? <MailOpen /> : <Mail />}
                  {isNew ? "Mark as read" : "Mark as unread"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setStatus.mutate("archived")}
                >
                  <Archive /> Archive
                </Button>
              </>
            )}
          </>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={busy}
          onClick={() => {
            if (window.confirm("Delete this inquiry? This can't be undone.")) {
              remove.mutate()
            }
          }}
        >
          <Trash2 /> Delete
        </Button>
      </div>
    </li>
  )
}

function InquiryList({ view }: { view: View }) {
  const { user } = useAuth()
  const { data } = useSuspenseQuery(inquiriesQueryOptions())
  const items = data.data.filter((i) => VIEWS[view].includes(i.status))

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <InboxIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">
          {view === "inbox" ? "No messages yet" : `Nothing ${view} yet`}
        </h3>
        <p className="max-w-sm text-muted-foreground">
          {view === "inbox"
            ? user?.is_published && user.username
              ? "When brands use the contact form on your public page, their messages show up here."
              : "Publish your page so brands can send you messages through its contact form."
            : "Inquiries you move here will be listed in this tab."}
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((inquiry) => (
        <InquiryCard key={inquiry.id} inquiry={inquiry} />
      ))}
    </ul>
  )
}

function Inbox() {
  const [view, setView] = useState<View>("inbox")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight">
          Inbox
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Messages from the contact form on your public page. Convert one into a
          project to start working on it.
        </p>
      </div>
      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
          <TabsTrigger value="converted">Converted</TabsTrigger>
        </TabsList>
      </Tabs>
      <Suspense fallback={<PendingItems />}>
        <InquiryList view={view} />
      </Suspense>
    </div>
  )
}
