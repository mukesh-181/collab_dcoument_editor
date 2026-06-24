"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Settings } from "lucide-react";
import { extractUserInfo } from "@/utils/user-utils";
import { logout } from "@/features/auth/actions/logout.action";
import { SignOutDialogContent } from "@/features/auth/components/sign-out-button";
import { Dialog } from "@/components/ui/dialog";
import { SettingsDialog } from "./settings-dialog";

export function UserDropdownMenu({ user }: { user: User }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [isSignOutPending, setIsSignOutPending] = useState(false);

  const handleSignOut = async () => {
    setIsSignOutPending(true);
    await logout();
  };

  const { name: fullName, image: avatarUrl } = extractUserInfo(user);
  const initial = fullName.charAt(0).toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 focus:outline-none cursor-pointer rounded-full">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden sm:block pl-2">
              {fullName}
            </span>
            <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-xs">
                {initial}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 mt-2 rounded-xl p-1 z-50">
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100 truncate">{fullName}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
              {user.email}
            </p>
          </div>
          <DropdownMenuSeparator className="mx-1" />
          <DropdownMenuItem 
            className="cursor-pointer rounded-lg m-1 focus:bg-zinc-100 dark:focus:bg-zinc-800"
            onSelect={(e) => {
              e.preventDefault();
              setIsSettingsOpen(true);
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
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

      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
        user={user} 
      />

      <Dialog open={isSignOutOpen} onOpenChange={setIsSignOutOpen}>
        <SignOutDialogContent 
          isOpen={isSignOutOpen} 
          setIsOpen={setIsSignOutOpen} 
          isPending={isSignOutPending} 
          onConfirm={handleSignOut} 
        />
      </Dialog>
    </>
  );
}
