import { AlertTriangle } from "lucide-react"

import DeleteConfirmation from "./DeleteConfirmation"

const DeleteAccount = () => {
  return (
    <section className="rounded-xl border border-destructive/50 bg-destructive/5 p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
        <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Once you delete your account, there is no going back. Please be certain.
      </p>
      <DeleteConfirmation />
    </section>
  )
}

export default DeleteAccount
