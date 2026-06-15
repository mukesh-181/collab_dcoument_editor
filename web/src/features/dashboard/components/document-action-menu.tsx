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

interface DocumentActionMenuProps {
  documentId: string;
  documentTitle: string;
  role: string;
}

export function DocumentActionMenu({
  documentId,
  documentTitle,
  role,
}: DocumentActionMenuProps) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // If viewer, don't render the menu at all to keep UI clean
  if (role === "viewer") return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 opacity-0 group-hover:opacity-100 transition-opacity"
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
          {(role === "owner" || role === "editor") && (
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
              onSelect={(e) => {
                e.preventDefault();
                setIsDeleteOpen(true);
              }}
              className="cursor-pointer rounded-lg font-medium text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
            >
              <Trash2 className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
              Delete
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
    </>
  );
}
