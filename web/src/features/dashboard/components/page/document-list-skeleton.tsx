import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

export function DocumentListSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="px-6 py-6 max-w-5xl mx-auto w-full space-y-6">
        
        {/* Header / Toolbar Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-6 lg:hidden rounded-md" />
            <h2 className="text-[18px] font-semibold text-zinc-800 dark:text-zinc-200">Documents</h2>
          </div>

          <div className="flex items-center gap-3">
            <Skeleton className="hidden sm:block h-4 w-24 mr-2" />
            <div className="relative w-full sm:w-[260px]">
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <Skeleton className="h-9 w-[170px] rounded-md shrink-0" />
          </div>
        </div>
        
        {/* Grid Container Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          
          {/* Create New Document Card Skeleton */}
          <div className="group relative flex flex-col h-[240px] bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-sm">
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 rounded-t-sm">
              <Plus className="w-12 h-12 text-zinc-300 dark:text-zinc-700" strokeWidth={1} />
            </div>
            <div className="shrink-0 h-[76px] px-3 flex items-center justify-center rounded-b-sm bg-white dark:bg-zinc-950">
              <span className="truncate text-[14px] font-medium text-zinc-400 dark:text-zinc-600">Blank document</span>
            </div>
          </div>

          {/* Document Card Skeletons */}
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex flex-col h-[240px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm">
              <div className="flex-1 p-4 pt-5 bg-white dark:bg-zinc-950 rounded-t-sm overflow-hidden">
                <Skeleton className="h-3 w-[80%] mb-4" />
                <Skeleton className="h-3 w-[90%] mb-4" />
                <Skeleton className="h-3 w-[85%] mb-4" />
                <Skeleton className="h-3 w-[60%]" />
              </div>
              
              {/* Card Footer */}
              <div className="shrink-0 h-[76px] px-3 py-2.5 flex flex-col justify-between border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-b-sm">
                <Skeleton className="h-4 w-[70%]" />
                <div className="flex items-center justify-between mt-1">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  )
}
