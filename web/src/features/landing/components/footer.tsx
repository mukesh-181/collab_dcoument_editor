export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-8 text-center">
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        &copy; {new Date().getFullYear()} CollabDoc, Inc. All rights reserved.
      </div>
    </footer>
  )
}
