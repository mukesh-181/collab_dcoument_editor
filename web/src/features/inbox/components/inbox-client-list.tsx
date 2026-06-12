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

export type FilterType = "all" | "pending" | "accepted" | "rejected" | "expired";

export function InboxClientList({ initialInvites }: { initialInvites: any[] }) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredInvites = useMemo(() => {
    return initialInvites.filter((invite) => {
      const isExpired = invite.status === 'expired' || (invite.expires_at && new Date(invite.expires_at) < new Date());
      
      if (filter === "all") return true;
      if (filter === "expired") return isExpired && invite.status === 'pending';
      if (filter === "pending") return invite.status === 'pending' && !isExpired;
      return invite.status === filter;
    });
  }, [initialInvites, filter]);

  return (
    <div className="flex flex-col w-full h-full max-w-4xl mx-auto px-6 py-8">
      <InboxRealtimeListener />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Inbox</h1>
        
        {initialInvites.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-zinc-500 font-medium mr-1 hidden sm:inline-block">
              {filteredInvites.length} invite{filteredInvites.length !== 1 ? 's' : ''}
            </span>
            <Select value={filter} onValueChange={(val: FilterType) => setFilter(val)}>
              <SelectTrigger className="w-[140px] sm:w-[150px] h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-[14px]">
                <SelectValue placeholder="All Invites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Invites</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {filteredInvites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
            {filter === "all" ? "You're all caught up!" : `No ${filter} invitations.`}
          </p>
          <p className="text-[14px] text-zinc-500 mt-1">
            {filter === "all" ? "You don't have any invitations." : "Try changing the filter to see other invites."}
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
