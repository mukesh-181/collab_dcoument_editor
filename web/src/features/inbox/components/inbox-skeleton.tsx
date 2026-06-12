import { Skeleton } from "@/components/ui/skeleton";

export function InboxSkeleton() {
  return (
    <div className="flex flex-col w-full h-full max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Inbox</h1>
      
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 py-5 px-5 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm relative items-center">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            
            <div className="flex flex-col flex-1 gap-2.5">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>

            <div className="absolute top-4 right-4">
              <Skeleton className="h-4 w-32" />
            </div>

            <div className="absolute bottom-4 right-4 flex gap-2">
              <Skeleton className="h-7 w-[84px] rounded-md" />
              <Skeleton className="h-7 w-[84px] rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
