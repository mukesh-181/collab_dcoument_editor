import { Skeleton } from "@/components/ui/skeleton";

export function InboxSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto relative">
      <div className="relative z-10 px-6 py-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500">
              Inbox
            </h1>
            <div className="h-6 w-[1.5px] rounded-full bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
            <Skeleton className="h-4 w-12 hidden sm:block" />
          </div>

          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-16 hidden sm:block" />
            <Skeleton className="h-9 w-[260px] rounded-full hidden md:block" />
            <Skeleton className="h-9 w-[140px] rounded-full md:hidden" />
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-4 p-5 sm:p-6 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl shadow-sm relative overflow-hidden transition-all group/item">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] dark:opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
              <div className="relative z-10 flex gap-4 w-full items-center">
                <Skeleton className="w-12 h-12 rounded-full shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
                
                <div className="flex flex-col flex-1 gap-2.5">
                  <Skeleton className="h-5 w-[60%] max-w-[200px] bg-zinc-200/50 dark:bg-zinc-800/50" />
                  <Skeleton className="h-4 w-[90%] max-w-[300px] bg-zinc-200/50 dark:bg-zinc-800/50" />
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <Skeleton className="h-10 w-[84px] rounded-xl bg-zinc-200/50 dark:bg-zinc-800/50" />
                  <Skeleton className="h-10 w-[84px] rounded-xl bg-zinc-200/50 dark:bg-zinc-800/50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
