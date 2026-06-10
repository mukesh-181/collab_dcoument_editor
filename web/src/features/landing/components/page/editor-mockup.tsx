export function EditorMockup() {
  return (
    <div className="mt-24 w-full max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex items-center border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
          </div>
        </div>
        <div className="p-8 sm:p-12">
          <div className="mx-auto max-w-2xl space-y-4 text-left">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Project Requirements</h2>
            <p className="text-zinc-500 leading-relaxed dark:text-zinc-400">
              CollabDoc is designed to handle multiple concurrent users seamlessly. 
              The underlying architecture relies on Conflict-free Replicated Data Types (CRDTs) to ensure that text merges deterministically without a central authority dictating state.
            </p>
            <div className="flex items-center gap-2 pt-4">
              <div className="h-5 w-5 rounded-sm bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">
                M
              </div>
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                Mukesh is editing...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
