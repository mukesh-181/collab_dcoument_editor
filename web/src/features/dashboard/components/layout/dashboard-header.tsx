"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Inbox, LayoutGrid, FileText } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { logout } from "@/features/auth/actions/logout.action";
import { SignOutDialogContent } from "@/features/auth/components/sign-out-button";
import { Dialog } from "@/components/ui/dialog";
import { useEffect, useState, useMemo } from "react";
import { getUnreadCount } from "@/features/inbox/actions/get-unread-count.action";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/constants/routes";

export function DashboardHeader({ user }: { user: User | null }) {
  const pathname = usePathname();
  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initial = fullName.charAt(0).toUpperCase();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [isSignOutPending, setIsSignOutPending] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const handleSignOut = async () => {
    setIsSignOutPending(true);
    await logout();
  };

  useEffect(() => {
    if (!user?.email) return;

    // Fetch initial count
    getUnreadCount().then(setUnreadCount);

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
          getUnreadCount().then(setUnreadCount);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, supabase]);

  const isDocumentPage = pathname?.match(/^\/dashboard\/[^/]+$/);

  if (isDocumentPage) {
    return null;
  }

  const NavItem = ({ icon: Icon, label, href, badge }: any) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`relative flex items-center px-3 py-1.5 text-sm font-medium transition-colors ${
          isActive
            ? "text-zinc-900 dark:text-white"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label}
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 bg-white/70 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/70 supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-14 items-center px-6 gap-8 max-w-7xl mx-auto">
        {/* Brand */}
        <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2 mr-4 cursor-pointer transition-opacity">
          <Image 
            src="/logo-final.png" 
            alt="CollabDoc" 
            width={150} 
            height={32} 
            className="object-contain" 
            priority 
          />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-1 flex-1">
          <NavItem icon={LayoutGrid} label="Dashboard" href={ROUTES.DASHBOARD} />
          <NavItem icon={Inbox} label="Inbox" href={ROUTES.INBOX} badge={unreadCount} />
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 focus:outline-none cursor-pointer rounded-full transition-all group">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden sm:block pl-2 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                  {fullName}
                </span>
                <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-transform group-hover:scale-105">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-xs">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 mt-2 rounded-xl p-1">
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100">{fullName}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 break-all">
                  {user?.email}
                </p>
              </div>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem 
                className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer rounded-lg m-1"
                onSelect={(e) => {
                  e.preventDefault();
                  setIsSignOutOpen(true);
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isSignOutOpen} onOpenChange={setIsSignOutOpen}>
            <SignOutDialogContent 
              isOpen={isSignOutOpen} 
              setIsOpen={setIsSignOutOpen} 
              isPending={isSignOutPending} 
              onConfirm={handleSignOut} 
            />
          </Dialog>
        </div>
      </div>
    </header>
  );
}
