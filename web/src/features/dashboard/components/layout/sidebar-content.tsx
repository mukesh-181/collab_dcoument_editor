"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Settings, Inbox, LayoutGrid } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { useEffect, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { getUnreadCount } from "@/features/inbox/actions/get-unread-count.action";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/constants/routes";
import { extractUserInfo } from "@/utils/user-utils";
import useSWR from "swr";

function NavItem({ icon: Icon, label, href, badge, pathname }: { icon: LucideIcon; label: string; href: string; badge?: number; pathname: string }) {
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between h-9 px-3 rounded-xl transition-all ${
        isActive
          ? "bg-white shadow-sm ring-1 ring-zinc-200/50 dark:bg-zinc-800 dark:ring-zinc-700/50"
          : "hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
      }`}
    >
      <div className="flex items-center">
        <Icon
          className={`mr-3 h-[18px] w-[18px] shrink-0 ${
            isActive
              ? "text-primary"
              : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
          }`}
        />
        <span
          className={`text-[14px] ${
            isActive
              ? "text-zinc-900 dark:text-zinc-100 font-semibold"
              : "font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
          }`}
        >
          {label}
        </span>
      </div>
      {badge !== undefined && (
        <span
          className={`flex h-5 items-center justify-center rounded-full px-2 text-[12px] font-bold ${
            label === "Inbox"
              ? "bg-primary text-primary-foreground"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export function SidebarContent({
  user,
}: {
  documents?: Record<string, unknown>[];
  user?: User | null;
}) {
  const pathname = usePathname();
  const { name: fullName, image: avatarUrl } = extractUserInfo(user);
  const initial = fullName.charAt(0).toUpperCase();

  const supabase = useMemo(() => createClient(), []);
  
  const { data: unreadCount = 0, mutate } = useSWR(
    user?.email ? "unread-count" : null,
    getUnreadCount,
    { fallbackData: 0 }
  );

  useEffect(() => {
    if (!user?.email) return;

    // Setup realtime listener for instant badge updates globally
    const channelName = `global-inbox-badge-${crypto.randomUUID()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invites",
          filter: `email=eq.${user.email}`,
        },
        () => {
          mutate();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, supabase, mutate]);

  return (
    <div className="flex h-full flex-col p-4">
      {/* Brand Header */}
      <div className="flex items-center gap-2 mb-6 px-2 mt-2">
        <Link href={ROUTES.HOME} className="cursor-pointer hover:opacity-80 transition-opacity">
          <Image 
            src="/logo-final.png" 
            alt="CollabDoc" 
            width={130} 
            height={36} 
            className="object-contain" 
            style={{ width: 'auto', height: 'auto' }}
            priority 
          />
        </Link>
      </div>

      {/* Profile Section */}
      <div className="flex items-center justify-between shrink-0 mb-6 px-2 bg-zinc-50/50 dark:bg-zinc-900/20 p-2 rounded-xl border-2 border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-white dark:border-zinc-800 shadow-sm">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-none">{fullName}</span>
            <span className="text-[11px] font-medium text-zinc-500 mt-1 leading-none">Pro Plan</span>
          </div>
        </div>
        <SignOutButton iconOnly />
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 -mx-2 px-2 pb-4">
        {/* Discover Section */}
        <div className="space-y-1">
          <div className="text-[13px] font-semibold text-zinc-400 px-3 pb-1">
            Discover
          </div>
          <NavItem
            icon={Inbox}
            label="Inbox"
            href={ROUTES.INBOX}
            badge={unreadCount > 0 ? unreadCount : undefined}
            pathname={pathname}
          />
          <NavItem
            icon={LayoutGrid}
            label="Dashboard"
            href={ROUTES.DASHBOARD}
            pathname={pathname}
          />
        </div>
      </div>

      <div className="shrink-0 pt-4 border-t-2 border-zinc-100 dark:border-zinc-800/50">
        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-500 hover:text-zinc-900 font-medium h-9 rounded-lg"
        >
          <Settings className="mr-2 h-[18px] w-[18px]" />
          Settings
        </Button>
      </div>
    </div>
  );
}
