import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

export function EditorSkeleton() {
  return (
    <div className="flex flex-col w-full min-h-full items-center pb-32">
      {/* Floating Toolbar Skeleton */}
      <div className="sticky top-14 z-40 w-full flex justify-center pt-4 pb-4 mb-4 bg-zinc-50 dark:bg-zinc-900 pointer-events-none">
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-md px-1 py-0.5 flex items-center justify-center pointer-events-auto max-w-[95%] overflow-hidden">
          <div className="flex items-center justify-start sm:justify-center gap-1 px-2 py-2 w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
            {/* HistoryControls (2 items) */}
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            
            <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700" />
            
            {/* HeadingControls (3 items, not 1 wide) */}
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            
            <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700" />
            
            {/* FontFamilyControl (1 wide item, w-32) */}
            <Skeleton className="h-8 w-32 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            
            <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700" />
            
            {/* FontSizeControl (1 medium item, w-20) */}
            <Skeleton className="h-8 w-20 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            
            <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700" />
            
            {/* FormatControls, Color, Highlight (8 items) */}
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            
            <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700" />
            
            {/* Link, Image, Table (3 items) */}
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            
            <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700" />
            
            {/* ListControls (3 items) */}
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />

            <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700" />
            
            {/* AlignmentControls (4 items) */}
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50" />
          </div>
        </div>
      </div>

      {/* A4 Page Skeleton */}
      <div className="max-w-[794px] w-full min-h-[1123px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-md px-16 py-20 mt-8 rounded-sm">
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
    <div className="flex flex-col flex-1 bg-transparent w-full">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 bg-white/70 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/70 supports-[backdrop-filter]:bg-white/60 shrink-0">
        <div className="flex h-14 items-center justify-between px-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            {/* Mobile Sidebar Trigger Skeleton */}
            <Skeleton className="md:hidden shrink-0 h-8 w-8 mr-2 -ml-2 rounded-md" />
            
            {/* Back Button Skeleton */}
            <div className="h-8 w-8 flex items-center justify-center rounded-md text-zinc-300 dark:text-zinc-700">
              <ArrowLeft className="h-4 w-4" />
            </div>

            <Separator orientation="vertical" className="h-8 mx-1 hidden sm:block" />

            {/* Title Skeleton */}
            <div className="flex flex-col ml-1 justify-center">
              <div className="flex items-center gap-2">
                <Skeleton className="h-[20px] w-[150px] sm:w-[250px]" />
              </div>
              <Skeleton className="h-3 w-16 mt-1.5" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Avatars Skeleton */}
            <div className="flex items-center -space-x-2 mr-2">
              <Skeleton className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-950 relative z-30" />
              <Skeleton className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-950 relative z-20" />
              <Skeleton className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-950 relative z-10" />
            </div>
            
            {/* Share/Leave Button Skeleton */}
            <Skeleton className="h-9 w-[72px] rounded-md" />
          </div>
        </div>
      </header>

      {/* Editor Area Skeleton */}
      <div className="flex-1 w-full pb-32 flex flex-col items-center bg-transparent relative z-0">
        <EditorSkeleton />
      </div>
    </div>
  );
}
