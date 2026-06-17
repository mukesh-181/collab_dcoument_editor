import { Skeleton } from "@/components/ui/skeleton";

export function InboxSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto relative">
      <div className="relative z-10 px-6 py-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 pointer-events-none">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Inbox
            </h1>
            <div className="h-6 w-[1.5px] rounded-full bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
            <span className="text-[15px] font-medium text-zinc-500 capitalize hidden sm:block">
              All
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-16 hidden sm:block" />
            
            {/* Desktop Filters */}
            <div className="hidden md:flex items-center bg-white/80 dark:bg-zinc-900/50 p-1 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm backdrop-blur-md">
              <div className="px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 bg-primary/10 dark:bg-primary/20 text-primary shadow-sm">All</div>
              <div className="px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 text-zinc-500">Invites</div>
              <div className="px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 text-zinc-500">Documents</div>
            </div>
            
            {/* Mobile Filter */}
            <div className="md:hidden">
              <div className="flex items-center justify-between h-9 w-[140px] rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-500 shadow-sm">
                 <span>All</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-4 py-5 px-5 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm relative overflow-hidden transition-all duration-300">
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
