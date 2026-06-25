"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { User as UserIcon, FileText, CreditCard, Shield, LogOut } from "lucide-react";
import { ProfileSettingsTab } from "./profile-settings-tab";
import { DocumentsSettingsTab } from "./documents-settings-tab";
import { logout } from "@/features/auth/actions/logout.action";
import { SignOutDialogContent } from "@/features/auth/components/sign-out-button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

type TabType = "profile" | "documents" | "billing" | "sessions";

export function SettingsDialog({ isOpen, onOpenChange, user }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [isSignOutPending, setIsSignOutPending] = useState(false);

  const handleSignOut = async () => {
    setIsSignOutPending(true);
    await logout();
  };

  const tabs = [
    { id: "profile", label: "My Profile", icon: UserIcon, disabled: false },
    { id: "documents", label: "Documents", icon: FileText, disabled: false },
        { id: "sessions", label: "Active Sessions (Soon)", icon: Shield, disabled: true },
    { id: "billing", label: "Billing & Plans (Soon)", icon: CreditCard, disabled: true },

  ] as const;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[50vw] p-0 overflow-hidden h-[85vh] sm:h-[650px] flex gap-0 rounded-[2rem]">
          <VisuallyHidden>
            <DialogTitle>User Settings</DialogTitle>
            <DialogDescription>Manage your account preferences and settings.</DialogDescription>
          </VisuallyHidden>
          
          {/* Sidebar */}
          <div className="w-64 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between py-6">
            <div className="space-y-1 px-3">
              <div className="px-3 pb-4">
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Settings</h2>
              </div>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    disabled={tab.disabled}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "bg-zinc-200/50 text-zinc-900 dark:bg-zinc-800/50 dark:text-zinc-100"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/30 dark:hover:text-zinc-200"
                    } ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            
            <div className="px-3 pt-4 border-t border-zinc-200 dark:border-zinc-800 mx-3">
              <button
                onClick={() => setIsSignOutOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-white dark:bg-zinc-900/30 overflow-y-auto p-8">
            {activeTab === "profile" && <ProfileSettingsTab user={user} />}
            {activeTab === "documents" && <DocumentsSettingsTab user={user} />}
            {/* Future tabs will be rendered here */}
          </div>
        </DialogContent>
      </Dialog>

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
