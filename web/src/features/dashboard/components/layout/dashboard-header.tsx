"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Inbox, LayoutGrid } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { UserDropdownMenu } from "@/features/user/components/user-dropdown-menu";
import { useEffect, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { getUnreadCount } from "@/features/inbox/actions/get-unread-count.action";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/constants/routes";
import useSWR from "swr";

function NavItem({ icon: Icon, label, href, badge, pathname }: { icon: LucideIcon; label: string; href: string; badge?: number; pathname: string }) {
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`relative flex items-center px-3 py-1.5 text-sm font-medium transition-colors rounded-lg ${
        isActive
          ? "text-zinc-900 bg-zinc-100 dark:text-zinc-100 dark:bg-zinc-800"
          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/50"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}

export function DashboardHeader({ user }: { user: User | null }) {
  const pathname = usePathname();
  const isDocumentPage = pathname?.match(/^\/dashboard\/[^/]+$/);
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

  if (isDocumentPage) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-zinc-200/50 bg-white/70 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/70 supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-14 items-center px-6 gap-8 max-w-7xl mx-auto">
        {/* Brand */}
        <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2 mr-4 cursor-pointer transition-opacity">
          <Image 
            src="/logo-final.png" 
            alt="CollabDoc" 
            width={150} 
            height={32} 
            className="object-contain" 
            style={{ width: 'auto', height: 'auto' }}
            priority 
          />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-1 flex-1">
          <NavItem icon={LayoutGrid} label="Dashboard" href={ROUTES.DASHBOARD} pathname={pathname} />
          <NavItem icon={Inbox} label="Inbox" href={ROUTES.INBOX} badge={unreadCount} pathname={pathname} />
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {user && <UserDropdownMenu user={user} />}
        </div>
      </div>
    </header>
  );
}
