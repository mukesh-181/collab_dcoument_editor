import { Skeleton } from "@/components/ui/skeleton";

export function DocumentListSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto relative">
      <div className="relative z-10 px-6 py-8 max-w-6xl mx-auto w-full space-y-8">
        
        {/* Header Row Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-[220px]">
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <Skeleton className="h-10 w-[110px] rounded-xl shrink-0" />
          </div>
        </div>
        
        {/* Document Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="relative flex flex-col h-[280px] bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              
              {/* Preview Area Skeleton */}
              <div className="relative flex-1 bg-zinc-50 dark:bg-zinc-950/50 p-6 flex flex-col gap-3">
                <Skeleton className="h-3 w-[85%]" />
                <Skeleton className="h-3 w-[70%]" />
                <Skeleton className="h-3 w-[90%]" />
                <Skeleton className="h-3 w-[60%]" />
                <Skeleton className="h-3 w-[80%] mt-2" />
                <Skeleton className="h-3 w-[50%]" />
              </div>
              
              {/* Card Footer Skeleton */}
              <div className="shrink-0 px-5 py-4 space-y-3 bg-white dark:bg-zinc-900/80 border-t border-zinc-100 dark:border-zinc-800/50">
                <div>
                  <Skeleton className="h-[15px] w-3/4 mb-1.5" />
                  <Skeleton className="h-3 w-1/2 mt-1" />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center">
                    <div className="flex items-center -space-x-1.5">
                      <Skeleton className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 relative z-30" />
                      <Skeleton className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 relative z-20" />
                      <Skeleton className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 relative z-10" />
                    </div>
                  </div>
                  <Skeleton className="h-[22px] w-[50px] rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
