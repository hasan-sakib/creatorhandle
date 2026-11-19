import { Check, Minus } from "lucide-react"

import { Reveal } from "@/components/home/Reveal"
import { cn } from "@/lib/utils"

const roles = ["Owner", "Admin", "Manager", "Member", "Viewer"] as const

// Mirrors the permission matrix in the backend (app/domain/permissions.py).
const rows: { label: string; allowed: boolean[] }[] = [
  {
    label: "View everything in the workspace",
    allowed: [true, true, true, true, true],
  },
  {
    label: "Create and edit brands, projects and tasks",
    allowed: [true, true, true, true, false],
  },
  {
    label: "Delete brands, projects and tasks",
    allowed: [true, true, true, false, false],
  },
  {
    label: "Manage members and workspace settings",
    allowed: [true, true, false, false, false],
  },
  {
    label: "Delete the workspace",
    allowed: [true, false, false, false, false],
  },
]

export function RolesSection() {
  return (
    <section id="teams" className="border-t bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Built for teams, too
          </h2>
          <p className="mt-4 text-muted-foreground">
            Create workspaces and give each person the access they need. Add
            collaborators and assign them tasks.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-12">
          <div className="relative overflow-x-auto rounded-2xl border bg-card shadow-sm">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th
                    scope="col"
                    className="px-5 py-4 text-left font-medium text-muted-foreground"
                  >
                    Permission
                  </th>
                  {roles.map((role) => (
                    <th
                      key={role}
                      scope="col"
                      className="px-3 py-4 text-center font-display font-semibold"
                    >
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.label} className={cn(i > 0 && "border-t")}>
                    <th scope="row" className="px-5 py-4 text-left font-normal">
                      {row.label}
                    </th>
                    {row.allowed.map((yes, j) => (
                      <td key={roles[j]} className="px-3 py-4 text-center">
                        {yes ? (
                          <>
                            <Check
                              className="mx-auto size-4 text-primary"
                              strokeWidth={3}
                              aria-hidden="true"
                            />
                            <span className="sr-only">Yes</span>
                          </>
                        ) : (
                          <>
                            <Minus
                              className="mx-auto size-4 text-muted-foreground/40"
                              aria-hidden="true"
                            />
                            <span className="sr-only">No</span>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
