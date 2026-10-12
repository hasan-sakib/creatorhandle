import { CalendarClock, Check } from "lucide-react"

import { Card } from "@/components/ui/card"
import { ProfileCardCompact } from "@/components/home/ExampleProfile"

/**
 * Hero collage: an example public profile with a couple of dashboard widgets
 * layered on top. Purely illustrative, so it is hidden from assistive tech and
 * replaced by a short text description.
 */
export function ProductMock() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <p className="sr-only">
        Illustration: an example creator profile page next to dashboard widgets for a brand
        campaign and a task checklist.
      </p>
      <div aria-hidden="true" className="relative pb-2 lg:pb-12 lg:pt-6">
        <ProfileCardCompact className="lg:pb-28" />

        <div className="mt-4 flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm shadow-md lg:absolute lg:left-6 lg:top-0 lg:mt-0">
          <span className="size-2 rounded-full bg-primary" />
          <span>
            <strong className="font-semibold">8</strong> active brand deals
          </span>
        </div>

        <Card className="mt-4 gap-3 p-4 shadow-lg lg:absolute lg:-right-3 lg:bottom-14 lg:mt-0 lg:w-[46%]">
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>Task checklist</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-5 place-items-center rounded-md border border-primary/40 bg-primary/10 text-primary">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              <span className="text-sm font-medium">Draft script revisions</span>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              Done
            </span>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
              <span>To Do</span>
              <span>In Progress</span>
              <span>Done</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <span className="h-1.5 rounded-full bg-primary" />
              <span className="h-1.5 rounded-full bg-primary" />
              <span className="h-1.5 rounded-full bg-primary" />
            </div>
          </div>
        </Card>

        <Card className="mt-4 gap-3 p-4 shadow-lg lg:absolute lg:-left-3 lg:bottom-0 lg:mt-0 lg:w-[50%]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Brand One campaign</p>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              In Progress
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" />
            Due in 3 days
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/3 rounded-full bg-primary" />
          </div>
        </Card>
      </div>
    </div>
  )
}
