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
        return ["pending", "accepted", "rejected", "expired"].includes(invite.status);
      }
      if (filter === "document") {
        return ["role_updated", "removed", "exited"].includes(invite.status);
      }
      return true;
    });
  }, [initialInvites, filter]);

  return (
    <div className="flex flex-col w-full h-full max-w-4xl mx-auto px-6 py-8">
      <InboxRealtimeListener />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Inbox</h1>
          <div className="h-6 w-[1px] bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
          <span className="text-lg font-medium text-zinc-500 capitalize hidden sm:block">{filter}</span>
        </div>
        
        {initialInvites.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-zinc-500 font-medium mr-1 hidden sm:inline-block">
              {filteredInvites.length} invite{filteredInvites.length !== 1 ? 's' : ''}
            </span>
            <Select value={filter} onValueChange={(val: FilterType) => setFilter(val)}>
              <SelectTrigger className="w-[140px] sm:w-[150px] h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-[14px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="invites">Invites</SelectItem>
                <SelectItem value="document">Document</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {filteredInvites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
            {filter === "all" ? "You're all caught up!" : filter === "invites" ? "No invitations yet!" : "No document activity."}
          </p>
          <p className="text-[14px] text-zinc-500 mt-1">
            {filter === "all" ? "You don't have any items in your inbox." : filter === "invites" ? "You don't have any pending or past invitations." : "You don't have any document updates."}
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
  );
}
