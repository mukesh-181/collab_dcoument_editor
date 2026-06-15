import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

export function EditorSkeleton() {
  return (
    <div className="flex flex-col w-full min-h-full">
      {/* Toolbar Skeleton */}
      <div className="sticky top-0 z-10 w-full bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-2 flex justify-center shadow-sm">
        <div className="w-full max-w-[794px]">
          <div className="flex items-center justify-start sm:justify-center gap-1 px-2 py-2 w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            
            <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700" />
            
            <Skeleton className="h-8 w-[120px] rounded-md shrink-0" />
            
            <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700" />
            
            <Skeleton className="h-8 w-16 rounded-md shrink-0" />
            
            <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700" />
            
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            
            <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700" />
            
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            
            <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700" />
            
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
          </div>
        </div>
      </div>

      {/* Page Skeleton */}
      <div className="max-w-[794px] w-full min-h-[1123px] mx-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-md px-16 py-20 my-8 rounded-sm">
        <Skeleton className="h-10 w-[60%] mb-8" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-4 w-[95%] mb-4" />
        <Skeleton className="h-4 w-[85%] mb-4" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-4 w-[40%] mb-12" />
        
        <Skeleton className="h-6 w-[40%] mb-6" />
        <Skeleton className="h-4 w-[90%] mb-4" />
        <Skeleton className="h-4 w-[85%] mb-4" />
        <Skeleton className="h-4 w-full mb-4" />
      </div>
    </div>
  );
}

export function DocumentSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white dark:bg-zinc-950 w-full">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between h-14 pr-4 pl-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
        <div className="flex items-center gap-2">
          {/* Mobile Sidebar Trigger Skeleton */}
          <Skeleton className="h-8 w-8 rounded-md lg:hidden" />
          
          {/* Back Button Skeleton */}
          <div className="h-8 w-8 flex items-center justify-center rounded-md text-zinc-300 dark:text-zinc-700">
            <ArrowLeft className="h-4 w-4" />
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Title Skeleton */}
          <div className="flex flex-col ml-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-[18px] w-[150px] sm:w-[250px]" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Avatars Skeleton */}
          <div className="flex items-center -space-x-2 mr-2">
            <Skeleton className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-950" />
            <Skeleton className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-950" />
            <Skeleton className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-950" />
          </div>
          
          {/* Share Button Skeleton */}
          <Skeleton className="h-9 w-[72px] rounded-md" />
        </div>
      </div>

      {/* Editor Area Skeleton */}
      <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-900 min-h-0 flex flex-col w-full">
        <EditorSkeleton />
      </div>
    </div>
  );
}
