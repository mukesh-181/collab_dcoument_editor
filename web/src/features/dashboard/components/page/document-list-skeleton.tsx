import { Skeleton } from "@/components/ui/skeleton";

import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

export function DocumentListSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto relative">
      <div className="relative z-10 px-6 py-8 max-w-6xl mx-auto w-full flex flex-col grow">
        
        {/* Static Header matching exact Dashboard UI */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8 shrink-0">
          <div className="space-y-1 shrink-0">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Your documents
            </h1>
            {/* The ONLY pulsing skeleton in the header is the document count */}
            <Skeleton className="h-5 w-[100px] mt-1" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 xl:gap-3 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0">
            {/* Filter Pills (Static) */}
            <div className="flex items-center bg-white/80 dark:bg-zinc-900/50 p-1 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm backdrop-blur-md shrink-0 pointer-events-none">
              <div className="px-3 sm:px-4 py-1.5 rounded-full text-[13px] font-medium bg-primary/10 dark:bg-primary/20 text-primary shadow-sm whitespace-nowrap">All</div>
              <div className="px-3 sm:px-4 py-1.5 rounded-full text-[13px] font-medium text-zinc-500 whitespace-nowrap">Owned</div>
              <div className="px-3 sm:px-4 py-1.5 rounded-full text-[13px] font-medium text-zinc-500 whitespace-nowrap">Shared</div>
              <div className="px-3 sm:px-4 py-1.5 rounded-full text-[13px] font-medium text-zinc-500 whitespace-nowrap">Editor</div>
              <div className="px-3 sm:px-4 py-1.5 rounded-full text-[13px] font-medium text-zinc-500 whitespace-nowrap">Viewer</div>
            </div>

            <div className="flex items-center gap-3 shrink-0 pointer-events-none">
              {/* Search (Static) */}
              <div className="relative w-full sm:w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Search docs"
                  disabled
                  className="pl-9 h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-[14px] rounded-xl shadow-sm w-full"
                />
              </div>
              
              {/* Create Button (Static) */}
              <button disabled className="flex items-center gap-2 h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground text-[14px] font-semibold rounded-xl shadow-sm whitespace-nowrap">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Create
              </button>
            </div>
          </div>
        </div>
        
        {/* Document Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="relative flex flex-col h-[280px] bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              
              {/* Preview Area Skeleton */}
              <div className="relative flex-1 bg-zinc-50 dark:bg-zinc-950/50 p-6 flex flex-col gap-3">
                <Skeleton className="h-2.5 w-[85%]" />
                <Skeleton className="h-2.5 w-[70%]" />
                <Skeleton className="h-2.5 w-[90%]" />
                <Skeleton className="h-2.5 w-[60%]" />
                <Skeleton className="h-2.5 w-[80%] mt-2" />
                <Skeleton className="h-2.5 w-[50%]" />
                
                {/* Action Menu dots skeleton */}
                <div className="absolute top-4 right-4 z-20 flex gap-0.5">
                  <Skeleton className="w-1 h-1 rounded-full" />
                  <Skeleton className="w-1 h-1 rounded-full" />
                  <Skeleton className="w-1 h-1 rounded-full" />
                </div>
              </div>
              
              {/* Card Footer Skeleton (Exactly matching DocumentCard) */}
              <div className="shrink-0 px-5 py-4 space-y-3 bg-white dark:bg-zinc-900/80">
                <div>
                  <Skeleton className="h-4 w-3/4 mb-1.5" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center -space-x-1.5">
                      <Skeleton className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 relative shadow-sm" style={{ zIndex: 10 }} />
                      <Skeleton className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 relative shadow-sm" style={{ zIndex: 9 }} />
                    </div>
                  </div>
                  
                  {/* Role badge skeleton */}
                  <Skeleton className="h-6 w-14 rounded-full shrink-0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
