'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SignOutButton } from '@/features/auth/components/sign-out-button';

interface NavbarProps {
  displayName: string;
  avatarUrl?: string;
}

export default function Navbar({ displayName, avatarUrl }: NavbarProps) {
  return (
    <header className="relative z-10 h-14 shrink-0 border-b border-border bg-background flex items-center justify-between px-4 sm:px-6 lg:px-8 w-full">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-800">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-zinc-100 text-zinc-900 text-xs font-medium dark:bg-zinc-800 dark:text-zinc-100">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100">
              {displayName}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SignOutButton />
      </div>
    </header>
  );
}
