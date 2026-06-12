"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShareDialog } from "@/features/invites/components/share-dialog";
import { ActiveUsersCluster } from "./active-users-cluster";
import { MobileSidebar } from "@/features/dashboard/components/layout/mobile-sidebar";
import { DocumentRenameDialog } from "./document-rename-dialog";
import { DocumentSyncStatus } from "./document-sync-status";
import { DocumentMembersPopover } from "./document-members-popover";

interface DocumentHeaderProps {
  document: {
    id: string;
    title: string;
    updated_at: string;
    all_members?: {
      role: string;
      user: {
        id: string;
        name: string;
        image: string;
        email: string;
      };
    }[];
  };
  documents?: any[];
  currentUserRole?: string;
}

export function DocumentHeader({
  document,
  documents = [],
  currentUserRole = "viewer",
}: DocumentHeaderProps) {
  const [title, setTitle] = useState(document.title);

  return (
    <div className="flex items-center justify-between h-14 pr-4 pl-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
      <div className="flex items-center gap-2">
        <MobileSidebar documents={documents} />
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Dashboard</span>
          </Link>
        </Button>

        <Separator orientation="vertical" className="h-8 mx-1" />

        <div className="flex flex-col ml-1 justify-center">
          <div className="flex items-center gap-2 group">
            <h1 className="text-[18px] font-semibold text-zinc-900 dark:text-zinc-50 truncate max-w-[200px] sm:max-w-[400px]">
              {title}
            </h1>

            {currentUserRole !== "viewer" && (
              <DocumentRenameDialog
                documentId={document.id}
                initialTitle={title}
                onTitleUpdate={setTitle}
              />
            )}
          </div>

          <DocumentSyncStatus />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* View Only Badge */}
        {currentUserRole === "viewer" && (
          <div className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800 rounded-sm">
            View Only
          </div>
        )}

        {/* Active Users (Live Presence) */}
        <ActiveUsersCluster />

        {/* Member Avatars Popover */}
        <DocumentMembersPopover members={document.all_members} />

        {/* Invite Button */}
        {currentUserRole !== "viewer" && (
          <ShareDialog documentId={document.id} />
        )}
      </div>
    </div>
  );
}
