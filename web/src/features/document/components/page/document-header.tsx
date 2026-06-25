"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, LogOut, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShareDialog } from "@/features/invites/components/share-dialog";
import { ActiveUsersCluster } from "./active-users-cluster";
import { MobileSidebar } from "@/features/dashboard/components/layout/mobile-sidebar";
import { leaveDocumentAction } from "@/features/document/actions/leave-document.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DocumentRenameDialog } from "@/features/dashboard/components/dialogs/document-rename-dialog";
import { DocumentSyncStatus } from "./document-sync-status";
import { DocumentMembersPopover } from "./document-members-popover";
import { LeaveDocumentDialog } from "./leave-document-dialog";
import { DocumentActivityTree } from "./document-activity-tree";
import { useDocumentSync } from "./document-context";
import { ROUTES } from "@/constants/routes";
import { USER_FALLBACKS } from "@/utils/user-utils";

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
    invites?: Record<string, unknown>[];
  };
  documents?: Record<string, unknown>[];
  currentUserName?: string;
}

export function DocumentHeader({
  document,
  documents = [],
  currentUserName = USER_FALLBACKS.NAME,
}: DocumentHeaderProps) {
  const { currentUserRole } = useDocumentSync();
  const [title, setTitle] = useState(document.title);
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(document.title);
  }, [document.title]);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const router = useRouter();

  const handleLeave = async () => {
    const ownerMember = document.all_members?.find((m) => m.role === "owner");
    if (!ownerMember) {
      toast.error("Could not find document owner");
      return;
    }
    
    const result = await leaveDocumentAction(document.id, ownerMember.user.email, currentUserName);
    if (result.error) {
      toast.error(result.error);
      throw new Error(result.error); // to keep button loading state if we want, or just let it close
    } else {
      toast.success("You have left the document");
      router.push(ROUTES.DASHBOARD);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-950 shrink-0">
      <div className="flex h-14 items-center justify-between px-6 max-w-7xl mx-auto w-full">
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

          <Separator orientation="vertical" className="h-8 mx-1 hidden sm:block" />

          <div className="flex flex-col ml-1 justify-center">
            <div className="flex items-center gap-2 group">
              <h1 className="text-[18px] font-semibold text-zinc-900 dark:text-zinc-50 truncate max-w-[200px] sm:max-w-[400px]">
                {title}
              </h1>

              {currentUserRole === "owner" && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsRenameDialogOpen(true)}
                    className="h-5 w-5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center -ml-1"
                  >
                    <Pencil className="h-3 w-3" />
                    <span className="sr-only">Rename document</span>
                  </Button>
                  <DocumentRenameDialog
                    documentId={document.id}
                    documentTitle={title}
                    isOpen={isRenameDialogOpen}
                    setIsOpen={setIsRenameDialogOpen}
                  />
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <DocumentSyncStatus />
              
              <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800 mt-0.5" />
              
              <button
                onClick={() => setIsActivityOpen(true)}
                className="flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 font-medium transition-colors mt-0.5"
                title="View Document Activity"
              >
                <History className="h-3.5 w-3.5" />
                <span className="underline underline-offset-2 decoration-zinc-300 dark:decoration-zinc-700 hover:decoration-zinc-500 dark:hover:decoration-zinc-400">Activity</span>
              </button>
              <DocumentActivityTree
                documentId={document.id}
                isOpen={isActivityOpen}
                setIsOpen={setIsActivityOpen}
              />
            </div>
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
        <DocumentMembersPopover 
          members={document.all_members} 
          invites={document.invites as { id: string; email: string; status: string; expires_at: string; role: string; name?: string | null; image?: string | null }[]}
          documentId={document.id} 
          currentUserRole={currentUserRole} 
        />



        {/* Invite Button */}
        {currentUserRole === "owner" && (
          <ShareDialog 
            documentId={document.id} 
            allMembers={document.all_members as Array<{ role: string; user: { id: string; name: string; image: string; email: string } }>}
            invites={document.invites as Array<{ email: string; status: string; expires_at: string }>}
          />
        )}

        {/* Leave Document Button */}
        {currentUserRole !== "owner" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLeaveDialogOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 px-2"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="text-[13px]">Leave</span>
            </Button>
            <LeaveDocumentDialog 
              isOpen={isLeaveDialogOpen}
              setIsOpen={setIsLeaveDialogOpen}
              documentTitle={document.title}
              onConfirm={handleLeave}
            />
          </>
        )}
      </div>
      </div>
    </header>
  );
}
