export function ProfileFooter({ name }: { name: string }) {
  return (
    <footer className="relative mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-2 border-t pt-6 text-sm text-muted-foreground sm:flex-row">
        <p>
          © {new Date().getFullYear()} {name}
        </p>
        <p>
          Made with{" "}
          <a href="/" className="font-medium text-accent-text hover:underline">
            CreatorHandle
          </a>
          . <a href="/app/login" className="hover:text-foreground hover:underline">Create your own page</a>
        </p>
      </div>
    </footer>
  )
}
