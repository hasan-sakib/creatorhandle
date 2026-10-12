import {
  Building2,
  FolderKanban,
  Globe,
  LayoutDashboard,
  ListChecks,
  Palette,
  Users,
} from "lucide-react"
import type { ComponentType, ReactNode } from "react"

import { Reveal } from "@/components/home/Reveal"
import { Card } from "@/components/ui/card"
import { categoryPill } from "@/lib/categories"
import { cn } from "@/lib/utils"

function FeatureCard({
  icon: Icon,
  title,
  text,
  className,
  delay,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  text: string
  className?: string
  delay?: number
  children?: ReactNode
}) {
  return (
    <Reveal delay={delay} className={cn("h-full min-w-0", className)}>
      <Card className="h-full gap-4 p-6 transition-shadow hover:shadow-md">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{text}</p>
        </div>
        {children && <div className="mt-auto pt-2">{children}</div>}
      </Card>
    </Reveal>
  )
}

const board = [
  { column: "To Do", tasks: [{ name: "Plan shoot", priority: "bg-red-400" }] },
  {
    column: "In Progress",
    tasks: [
      { name: "Edit video", priority: "bg-amber-400" },
      { name: "Write caption", priority: "bg-green-400" },
    ],
  },
  { column: "Done", tasks: [{ name: "Send invoice", priority: "bg-green-400" }] },
]

const swatches = [
  "bg-teal-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-orange-500",
  "bg-green-500",
  "bg-sky-500",
  "bg-slate-500",
  "bg-gradient-to-br from-orange-400 to-pink-500",
  "bg-gradient-to-br from-teal-400 to-violet-500",
]

export function FeaturesSection() {
  return (
    <section id="features" className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to run the business side
          </h2>
          <p className="mt-4 text-muted-foreground">
            Track the work, keep your team aligned and show it off, all from one place.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={ListChecks}
            title="Kanban tasks"
            text="Move work through To Do, In Progress and Done. Set a priority and a due date, and assign it to a collaborator."
            className="lg:col-span-2"
          >
            <div aria-hidden="true" className="grid grid-cols-3 gap-2 sm:gap-3">
              {board.map((col) => (
                <div key={col.column} className="min-w-0 rounded-xl border bg-background p-2 sm:p-3">
                  <p className="mb-2 truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                    {col.column}
                  </p>
                  <div className="space-y-2">
                    {col.tasks.map((task) => (
                      <div
                        key={task.name}
                        className="flex items-center gap-1.5 rounded-lg border bg-card px-2 py-2 text-xs font-medium shadow-sm sm:gap-2 sm:px-2.5"
                      >
                        <span className={cn("size-2 shrink-0 rounded-full", task.priority)} />
                        <span className="truncate">{task.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </FeatureCard>

          <FeatureCard
            icon={Building2}
            title="Brand CRM"
            text="Keep every brand in one list with a category, a contact person, a status and notes."
            delay={100}
          >
            <div aria-hidden="true" className="space-y-2">
              {[
                { name: "Brand One", category: "Tech", active: true },
                { name: "Studio Two", category: "Beauty", active: true },
                { name: "Acme Co", category: "Food", active: false },
              ].map((brand) => (
                <div
                  key={brand.name}
                  className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        brand.active ? "bg-green-500" : "bg-muted-foreground/40",
                      )}
                    />
                    {brand.name}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      categoryPill[brand.category],
                    )}
                  >
                    {brand.category}
                  </span>
                </div>
              ))}
            </div>
          </FeatureCard>

          <FeatureCard
            icon={FolderKanban}
            title="Project tracking"
            text="Log each project by type, status and deadline, and mark your best work as featured."
          >
            <div aria-hidden="true" className="flex flex-wrap gap-1.5 text-[11px] font-medium">
              {["Planning", "In Progress", "Review", "Published"].map((status, i) => (
                <span
                  key={status}
                  className={cn(
                    "rounded-full border px-2.5 py-1",
                    i === 1 ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground",
                  )}
                >
                  {status}
                </span>
              ))}
            </div>
          </FeatureCard>

          <FeatureCard
            icon={LayoutDashboard}
            title="Dashboard overview"
            text="See upcoming deadlines and how much of your work is done the moment you sign in."
            delay={100}
          >
            <div aria-hidden="true" className="rounded-lg border bg-background p-3">
              <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                <span>Tasks done</span>
                <span>Example</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-3/4 rounded-full bg-primary" />
              </div>
            </div>
          </FeatureCard>

          <FeatureCard
            icon={Users}
            title="Workspaces and teams"
            text="Work solo in your own workspace, or create more and give each person the access they need."
            delay={200}
          >
            <div aria-hidden="true" className="flex -space-x-2">
              {["bg-teal-500", "bg-indigo-500", "bg-rose-500", "bg-orange-500"].map((c) => (
                <span key={c} className={cn("size-8 rounded-full border-2 border-card", c)} />
              ))}
              <span className="grid size-8 place-items-center rounded-full border-2 border-card bg-muted text-[11px] font-medium text-muted-foreground">
                +
              </span>
            </div>
          </FeatureCard>

          <FeatureCard
            icon={Globe}
            title="Public profile page"
            text="Publish your work at /@yourhandle and switch it off again whenever you like."
            className="lg:col-span-2"
          >
            <div
              aria-hidden="true"
              className="flex items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3"
            >
              <span className="truncate text-sm">
                creatorhandle.com/<span className="font-semibold text-primary">@yourhandle</span>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                Published
                <span className="relative h-5 w-9 rounded-full bg-primary">
                  <span className="absolute right-0.5 top-0.5 size-4 rounded-full bg-white" />
                </span>
              </span>
            </div>
          </FeatureCard>

          <FeatureCard
            icon={Palette}
            title="Light, dark and your color"
            text="Switch between light and dark mode and pick one of 10 accent colors for your dashboard."
            delay={100}
          >
            <div aria-hidden="true" className="grid w-fit grid-cols-5 gap-2.5">
              {swatches.map((s) => (
                <span key={s} className={cn("size-6 rounded-full", s)} />
              ))}
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  )
}
