"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DocumentRenameDialog } from "./document-rename-dialog";
import { DocumentDeleteDialog } from "./document-delete-dialog";
import { LeaveDocumentDialog } from "@/features/document/components/page/leave-document-dialog";
import { leaveDocumentAction } from "@/features/document/actions/leave-document.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

interface DocumentActionMenuProps {
  documentId: string;
  documentTitle: string;
  role: string;
  ownerEmail?: string;
  currentUserName?: string;
}

export function DocumentActionMenu({
  documentId,
  documentTitle,
  role,
  ownerEmail = "",
  currentUserName = "Unknown User",
}: DocumentActionMenuProps) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const router = useRouter();

  const handleLeave = async () => {
    if (!ownerEmail) {
      toast.error("Could not find document owner");
      return;
    }
    const result = await leaveDocumentAction(documentId, ownerEmail, currentUserName);
    if (result.error) {
      toast.error(result.error);
      throw new Error(result.error);
    } else {
      toast.success("You have left the document");
      router.refresh();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 opacity-80"
            onClick={(e) => {
              // Prevent default/propagation if wrapped in a link
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl rounded-xl p-1.5">
          {role === "owner" && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setIsRenameOpen(true);
              }}
              className="cursor-pointer rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 focus:bg-indigo-50 dark:focus:bg-indigo-500/10 mb-1 font-medium text-zinc-700 dark:text-zinc-200"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
          )}
          {role === "owner" && (
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                setIsDeleteOpen(true);
              }}
              className="cursor-pointer rounded-lg font-medium"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
          {(role === "editor" || role === "viewer") && (
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                setIsLeaveOpen(true);
              }}
              className="cursor-pointer rounded-lg font-medium"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Leave
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DocumentRenameDialog
        documentId={documentId}
        documentTitle={documentTitle}
        isOpen={isRenameOpen}
        setIsOpen={setIsRenameOpen}
      />

      <DocumentDeleteDialog
        documentId={documentId}
        documentTitle={documentTitle}
        isOpen={isDeleteOpen}
        setIsOpen={setIsDeleteOpen}
      />

      <LeaveDocumentDialog
        isOpen={isLeaveOpen}
        setIsOpen={setIsLeaveOpen}
        documentTitle={documentTitle}
        onConfirm={handleLeave}
      />
    </>
  );
}
