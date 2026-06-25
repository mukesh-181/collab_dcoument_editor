"use client";

import { useState, useRef, useCallback } from "react";
import { InboxItem, type InboxInvite } from "./inbox-item";
import { InboxRealtimeListener } from "./inbox-realtime-listener";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInbox } from "../actions/get-inbox.action";
import { Loader2 } from "lucide-react";
import useSWRInfinite from "swr/infinite";

export type FilterType = "all" | "invites" | "document";

export function InboxClientList({ initialInvites, initialCount }: { initialInvites: InboxInvite[], initialCount: number }) {
  const [filter, setFilter] = useState<FilterType>("all");

  const getKey = (pageIndex: number, previousPageData: { data: InboxInvite[], count: number } | null) => {
    if (previousPageData && !previousPageData.data.length) return null; // reached the end
    return ['inbox', pageIndex, filter]; // SWR key
  };

  const fetcher = async (args: [string, number, FilterType]) => {
    const [, pageIndex, currentFilter] = args;
    return await getInbox(pageIndex, 15, currentFilter);
  };

  const { data, error, size, setSize, mutate } = useSWRInfinite<{ data: InboxInvite[], count: number }, Error>(
    getKey,
    fetcher,
    {
      fallbackData: filter === 'all' ? [{ data: initialInvites, count: initialCount }] : undefined,
      revalidateOnFocus: false,
      revalidateFirstPage: false,
    }
  );

  const invites = data ? data.flatMap(d => d.data) : [];
  const totalCount = data?.[0]?.count ?? 0;
  const isLoadingInitialData = !data && !error;
  const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.data.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.data.length < 15);
  const isFilterLoading = isLoadingInitialData && size === 1;

  const loadMore = useCallback(() => {
    if (isLoadingMore || isReachingEnd) return;
    setSize(size + 1);
  }, [isLoadingMore, isReachingEnd, setSize, size]);

  const fetchFiltered = useCallback(() => {
    mutate();
  }, [mutate]);

  const observer = useRef<IntersectionObserver | null>(null);
  const triggerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingMore) return;
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isReachingEnd) {
          loadMore();
        }
      });
      
      if (node) observer.current.observe(node);
    },
    [isLoadingMore, isReachingEnd, loadMore]
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto relative">
      <div className="relative z-10 px-6 py-8 max-w-4xl mx-auto w-full space-y-6">
        <InboxRealtimeListener onNewEvent={fetchFiltered} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Inbox
            </h1>
            <div className="h-6 w-[1.5px] rounded-full bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
            <span className="text-[15px] font-medium text-zinc-500 capitalize hidden sm:block">
              {filter}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[13px] text-zinc-500 font-medium hidden sm:inline-block">
              {totalCount} item{totalCount !== 1 ? "s" : ""}
            </span>
            <div className="hidden md:flex items-center bg-white/80 dark:bg-zinc-900/50 p-1 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm backdrop-blur-md">
              {[
                { id: 'all', label: 'All' },
                { id: 'invites', label: 'Invites' },
                { id: 'document', label: 'Documents' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as FilterType)}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                    filter === f.id 
                      ? "bg-primary/10 dark:bg-primary/20 text-primary shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="md:hidden">
              <Select value={filter} onValueChange={(val: FilterType) => setFilter(val)}>
                <SelectTrigger className="w-[140px] h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-[14px] rounded-full focus-visible:ring-indigo-500 shadow-sm transition-all">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="invites">Invites</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isFilterLoading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          </div>
        ) : invites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white/40 dark:bg-zinc-950/40 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm shadow-sm">
            <p className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
              {filter === "all"
                ? "You're all caught up!"
                : filter === "invites"
                  ? "No invitations yet!"
                  : "No document activity."}
            </p>
            <p className="text-[14px] text-zinc-500 mt-1">
              {filter === "all"
                ? "You don't have any items in your inbox."
                : filter === "invites"
                  ? "You don't have any pending or past invitations."
                  : "You don't have any document updates."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {invites.map((invite, index) => {
              // Trigger on the 12th item of the current batch (3 items before the end)
              const isTrigger = index === invites.length - 4;
              return (
                <div key={invite.id} ref={isTrigger ? triggerRef : null}>
                  <InboxItem 
                    invite={invite} 
                    onItemUpdate={() => {
                      mutate(); // Optimistic update could go here, but a revalidation is simplest and robust
                    }}
                  />
                </div>
              );
            })}
            
            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
