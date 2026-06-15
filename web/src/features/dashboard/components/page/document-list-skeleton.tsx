import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

export function DocumentListSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto relative">
      <div className="relative z-10 px-6 py-6 max-w-5xl mx-auto w-full space-y-6">
        
        {/* Header / Toolbar Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-6 lg:hidden rounded-md" />
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500">Documents</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Skeleton className="hidden sm:block h-4 w-24 mr-2" />
            <div className="relative w-full sm:w-[260px]">
              <Skeleton className="h-9 w-full rounded-full" />
            </div>
            <Skeleton className="h-9 w-[170px] rounded-full shrink-0 hidden md:block" />
          </div>
        </div>
        
        {/* Grid Container Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          
          {/* Create New Document Card Skeleton */}
          <div className="group relative flex flex-col h-[240px] bg-gradient-to-b from-indigo-50/30 to-purple-50/20 dark:from-indigo-900/10 dark:to-purple-900/10 border-2 border-dashed border-indigo-200/60 dark:border-indigo-800/60 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] dark:opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
            <div className="relative z-10 flex-1 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/50 dark:bg-zinc-900/50 border border-indigo-100/50 dark:border-indigo-900/50 shadow-sm flex items-center justify-center">
                <Plus className="w-6 h-6 text-indigo-300 dark:text-indigo-700" strokeWidth={2} />
              </div>
            </div>
            <div className="relative z-10 shrink-0 h-[76px] px-3 flex items-center justify-center pb-2">
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          </div>

          {/* Document Card Skeletons */}
          {[...Array(9)].map((_, i) => (
            <div key={i} className="group relative flex flex-col h-[240px] bg-gradient-to-b from-white/80 to-indigo-50/60 dark:from-zinc-950/80 dark:to-indigo-950/40 backdrop-blur-md border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] dark:opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
              <div className="relative z-10 flex-1 p-4 pt-5 rounded-t-2xl overflow-hidden bg-gradient-to-br from-indigo-50/40 to-purple-50/30 dark:from-indigo-900/10 dark:to-purple-900/10">
                <Skeleton className="h-3 w-[80%] mb-4 bg-zinc-200/50 dark:bg-zinc-800/50" />
                <Skeleton className="h-3 w-[90%] mb-4 bg-zinc-200/50 dark:bg-zinc-800/50" />
                <Skeleton className="h-3 w-[85%] mb-4 bg-zinc-200/50 dark:bg-zinc-800/50" />
                <Skeleton className="h-3 w-[60%] bg-zinc-200/50 dark:bg-zinc-800/50" />
              </div>
              
              {/* Card Footer */}
              <div className="relative z-10 shrink-0 h-[84px] px-3 py-2.5 flex flex-col justify-between border-t border-zinc-200/60 dark:border-zinc-800/60 bg-transparent rounded-b-2xl">
                <div>
                  <Skeleton className="h-4 w-[70%] bg-zinc-200/50 dark:bg-zinc-800/50" />
                  <Skeleton className="h-3 w-[40%] mt-2 bg-zinc-200/50 dark:bg-zinc-800/50" />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-4 w-4 bg-zinc-200/50 dark:bg-zinc-800/50" />
                    <Skeleton className="h-3 w-10 bg-zinc-200/50 dark:bg-zinc-800/50" />
                  </div>
                  <Skeleton className="h-5 w-12 rounded-md bg-zinc-200/50 dark:bg-zinc-800/50" />
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  )
}
