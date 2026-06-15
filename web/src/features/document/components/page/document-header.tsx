"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShareDialog } from "@/features/invites/components/share-dialog";
import { ActiveUsersCluster } from "./active-users-cluster";
import { MobileSidebar } from "@/features/dashboard/components/layout/mobile-sidebar";
import { leaveDocumentAction } from "@/features/document/actions/leave-document.action";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { DocumentRenameDialog } from "./document-rename-dialog";
import { DocumentSyncStatus } from "./document-sync-status";
import { DocumentMembersPopover } from "./document-members-popover";
import { useDocumentSync } from "./document-context";
import { ROUTES } from "@/constants/routes";
import { getUserName, getUserImage, getUserEmail, getUserRole, USER_FALLBACKS } from "@/utils/user-utils";


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
  currentUserName?: string;
}

export function DocumentHeader({
  document,
  documents = [],
  currentUserName = USER_FALLBACKS.NAME,
}: DocumentHeaderProps) {
  const { currentUserRole } = useDocumentSync();
  const [title, setTitle] = useState(document.title);
  const [isLeaving, startLeaving] = useTransition();
  const router = useRouter();

  const handleLeave = () => {
    startLeaving(async () => {
      const ownerMember = document.all_members?.find((m) => m.role === "owner");
      if (!ownerMember) {
        toast.error("Could not find document owner");
        return;
      }
      
      const result = await leaveDocumentAction(document.id, ownerMember.user.email, currentUserName);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("You have left the document");
        router.push(ROUTES.DASHBOARD);
      }
    });
  };

  return (
    <div className="flex items-center justify-between h-14 pr-4 pl-2 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-transparent shrink-0">
      <div className="flex items-center gap-2">
        <MobileSidebar documents={documents} />
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <Link href={ROUTES.DASHBOARD}>
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
        <DocumentMembersPopover members={document.all_members} documentId={document.id} currentUserRole={currentUserRole} />

        {/* Invite Button */}
        {currentUserRole === "owner" && (
          <ShareDialog 
            documentId={document.id} 
            allMembers={document.all_members}
            invites={document.invites}
          />
        )}

        {/* Leave Document Button */}
        {currentUserRole !== "owner" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeave}
            disabled={isLeaving}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 px-2"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="text-[13px]">Leave</span>
          </Button>
        )}
      </div>
    </div>
  );
}
