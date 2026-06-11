'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  PlusSquare,
  Inbox,
  LayoutGrid
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

export function SidebarContent({ user }: { documents?: any[], user?: User | null }) {
  const pathname = usePathname();
  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  const initial = fullName.charAt(0).toUpperCase();

  const NavItem = ({ icon: Icon, label, href, badge }: any) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`group flex items-center justify-between h-9 px-3 rounded-xl transition-all ${
          isActive
            ? 'bg-white shadow-sm ring-1 ring-zinc-200/50 dark:bg-zinc-800 dark:ring-zinc-700/50'
            : 'hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400'
        }`}
      >
        <div className="flex items-center">
          <Icon
            className={`mr-3 h-[18px] w-[18px] shrink-0 ${
              isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
            }`}
          />
          <span
            className={`text-[14px] ${
              isActive
                ? 'text-zinc-900 dark:text-zinc-100 font-semibold'
                : 'font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-100'
            }`}
          >
            {label}
          </span>
        </div>
        {badge && (
          <span className="flex h-5 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 text-[12px] font-medium text-zinc-600 dark:text-zinc-400">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col p-4">
      {/* Profile Section */}
      <div className="flex items-center justify-between shrink-0 mb-5">
        <Avatar className="h-10 w-10 border border-zinc-200/50 shadow-sm">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-zinc-100 text-zinc-900">{initial}</AvatarFallback>
        </Avatar>
        <SignOutButton iconOnly />
      </div>

      <div className="h-px bg-zinc-100 dark:bg-zinc-800/80 shrink-0 mb-5 -mx-4" />

      <div className="flex-1 overflow-y-auto space-y-6 -mx-2 px-2 pb-4">
        {/* Discover Section */}
        <div className="space-y-1">
          <div className="text-[13px] font-semibold text-zinc-400 px-3 pb-1">
            Discover
          </div>
          <NavItem icon={Inbox} label="Inbox" href="/inbox" badge="2" />
          <NavItem icon={LayoutGrid} label="Dashboard" href="/dashboard" />
        </div>
      </div>

      <div className="shrink-0 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
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
