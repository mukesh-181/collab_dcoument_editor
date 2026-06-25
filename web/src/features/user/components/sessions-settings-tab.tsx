"use client";

import { useTransition } from "react";
import { User } from "@supabase/supabase-js";
import { Shield, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/actions/logout.action";
import { toast } from "sonner";

interface SessionsSettingsTabProps {
  user: User;
}

export function SessionsSettingsTab({ user }: SessionsSettingsTabProps) {
  const [isPending, startTransition] = useTransition();

  const handleLogoutOthers = () => {
    startTransition(async () => {
      try {
        await logout("others");
        toast.success("Successfully logged out of all other devices.");
      } catch (error) {
        toast.error("Failed to log out of other devices.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Active Sessions</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your active sessions and devices.
        </p>
      </div>

      <div className="rounded-xl border-2 border-zinc-200 dark:border-zinc-800 p-5 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
            <Laptop className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Current Device</p>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
                Active Now
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              You are currently active on this device.
            </p>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mt-2 bg-zinc-100 dark:bg-zinc-800/50 inline-flex px-2 py-1 rounded-md">
              Signed in as &nbsp; <strong className="text-zinc-700 dark:text-zinc-400">{user.email}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t-2 border-zinc-100 dark:border-zinc-800/50 space-y-4">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Shield className="h-4 w-4 text-zinc-500" />
          Security Actions
        </h4>
        
        <div className="flex items-center justify-between p-5 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
          <div className="space-y-1 max-w-[70%]">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Log out of other devices</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              This will sign you out everywhere else but keep you logged in on this current device. Useful if you left your account logged in on a public computer.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogoutOthers}
            disabled={isPending}
            className="shrink-0 rounded-lg shadow-sm font-medium"
          >
            {isPending ? "Logging out..." : "Log out others"}
          </Button>
        </div>
      </div>
    </div>
  );
}
