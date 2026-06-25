"use client";

import { useRef, useCallback } from "react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDocumentActivity } from "../../actions/get-document-activity.action";
import { getUserName, getUserImage } from "@/utils/user-utils";
import { Loader2 } from "lucide-react";
import useSWRInfinite from "swr/infinite";
import { DocumentActivityRealtimeListener } from "./document-activity-realtime-listener";

interface DocumentActivityTreeProps {
  documentId: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

type UserInfo = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

type ActivityEvent = {
  id: string;
  action_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor: UserInfo;
  target?: UserInfo;
};

export function DocumentActivityTree({ documentId, isOpen, setIsOpen }: DocumentActivityTreeProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const getKey = (pageIndex: number, previousPageData: { hasMore?: boolean } | null) => {
    if (previousPageData && !previousPageData.hasMore) return null; 
    return ['activity', documentId, pageIndex]; 
  };

  const fetcher = async (args: [string, string, number]) => {
    const [, docId, pageIndex] = args;
    return await getDocumentActivity(docId, pageIndex + 1, 15);
  };

  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite(
    getKey,
    fetcher,
    {
      revalidateOnFocus: false, 
      revalidateIfStale: false,
    }
  );

  const activities = data ? data.flatMap(d => d.activity as unknown as ActivityEvent[]) : [];
  const isLoadingInitialData = !data && !error && isOpen;
  const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isReachingEnd = data?.[data.length - 1]?.hasMore === false;
  const isPending = isValidating && data && data.length === size;

  const triggerNodeRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isPending || isLoadingMore || isReachingEnd) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isReachingEnd) {
          setSize(size + 1);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isPending, isLoadingMore, isReachingEnd, setSize, size]
  );

  const renderEventText = (event: ActivityEvent) => {
    const actorName = getUserName(event.actor?.name, event.actor?.email);
    const targetName = event.target ? getUserName(event.target.name, event.target.email) : "";
    
    switch (event.action_type) {
      case "document_created":
        return <span className="text-zinc-700 dark:text-zinc-300"><b>{actorName}</b> created this document</span>;
      case "member_joined":
        return <span className="text-zinc-700 dark:text-zinc-300"><b>{actorName}</b> joined as {String(event.metadata?.role || "viewer")}</span>;
      case "member_removed":
        return <span className="text-zinc-700 dark:text-zinc-300"><b>{actorName}</b> has removed <b>{targetName}</b></span>;
      case "member_left":
        return <span className="text-zinc-700 dark:text-zinc-300"><b>{actorName}</b> left the document</span>;
      case "role_updated":
        return <span className="text-zinc-700 dark:text-zinc-300"><b>{actorName}</b> has updated <b>{targetName}</b>&apos;s role to {String(event.metadata?.new_role || "unknown")}</span>;
      default:
        return <span className="text-zinc-700 dark:text-zinc-300"><b>{actorName}</b> performed an action</span>;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <DocumentActivityRealtimeListener documentId={documentId} onNewEvent={() => mutate()} />
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0" aria-describedby={undefined}>
        <SheetHeader className="p-6 pb-2 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <SheetTitle>Document Activity</SheetTitle>
        </SheetHeader>

        <div className="flex-1 p-6 overflow-y-auto">
          {isLoadingInitialData ? (
            <div className="flex h-full items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center text-zinc-500 py-10 text-sm">
              No activity found.
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line connecting the avatars */}
              <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-zinc-200 dark:bg-zinc-800 z-0" />
              
              <div className="flex flex-col gap-6">
                {activities.map((event, index) => {
                  const actorImage = getUserImage(event.actor?.image);
                  const actorNameForInitial = getUserName(event.actor?.name, event.actor?.email);
                  const actorInitial = actorNameForInitial.charAt(0).toUpperCase();

                  // Trigger fetch when the 12th item of the current batch (i.e. length - 4) is scrolled into view
                  const isTriggerNode = index === activities.length - 4;

                  return (
                    <div 
                      key={event.id} 
                      ref={isTriggerNode ? triggerNodeRef : null}
                      className="relative z-10 flex gap-4"
                    >
                      <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 shrink-0 z-10">
                        <AvatarImage src={actorImage} alt={actorInitial} />
                        <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {actorInitial}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex flex-col pt-1 flex-1">
                        <p className="text-sm">
                          {renderEventText(event)}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                          <time className="text-xs text-zinc-500 dark:text-zinc-400">
                            {format(new Date(event.created_at), "MMM d, yyyy · h:mm a")}
                          </time>
                          {index === 0 && event.action_type !== "document_created" && (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                              Recent
                            </span>
                          )}
                          {event.action_type === "document_created" && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              Created
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {isLoadingMore && (
                <div className="flex justify-center py-6 relative z-10">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
