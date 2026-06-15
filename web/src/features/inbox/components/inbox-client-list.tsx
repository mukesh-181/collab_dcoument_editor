"use client";

import { useState, useMemo } from "react";
import { InboxItem } from "./inbox-item";
import { InboxRealtimeListener } from "./inbox-realtime-listener";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FilterType = "all" | "invites" | "document";

export function InboxClientList({ initialInvites }: { initialInvites: any[] }) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredInvites = useMemo(() => {
    return initialInvites.filter((invite) => {
      if (filter === "all") return true;
      if (filter === "invites") {
        return ["pending", "accepted", "rejected", "expired"].includes(
          invite.status,
        );
      }
      if (filter === "document") {
        return ["role_updated", "removed", "exited"].includes(invite.status);
      }
      return true;
    });
  }, [initialInvites, filter]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto relative">
      <div className="relative z-10 px-6 py-8 max-w-4xl mx-auto w-full space-y-6">
        <InboxRealtimeListener />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500">
              Inbox
            </h1>
            <div className="h-6 w-[1.5px] rounded-full bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
            <span className="text-[15px] font-medium text-zinc-500 capitalize hidden sm:block">
              {filter}
            </span>
          </div>

          {initialInvites.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-[13px] text-zinc-500 font-medium hidden sm:inline-block">
                {filteredInvites.length} item{filteredInvites.length !== 1 ? "s" : ""}
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
          )}
        </div>

        {filteredInvites.length === 0 ? (
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
            {filteredInvites.map((invite) => (
              <InboxItem key={invite.id} invite={invite} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
