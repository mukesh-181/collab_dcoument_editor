import { Skeleton } from "@/components/ui/skeleton";

export function DocumentListSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-8 flex shrink-0 justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Documents
          </h1>
          <p className="text-sm text-zinc-500 mt-1 dark:text-zinc-400">
            Manage your recent projects and collaborations.
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid shrink-0 grid-cols-[1fr_120px_120px_40px] gap-4 border-b border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-24" />
          <div />
        </div>
        <div className="min-h-0 flex-1 divide-y divide-zinc-200 overflow-y-auto overscroll-contain dark:divide-zinc-800">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_120px_120px_40px] gap-4 px-4 py-3 items-center"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
                <Skeleton className="h-4 w-48 max-w-[80%]" />
              </div>
              <div>
                <Skeleton className="h-4 w-16" />
              </div>
              <div>
                <Skeleton className="h-4 w-24" />
              </div>
              <div />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
