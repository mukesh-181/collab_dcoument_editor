"use client";

import { useState, useEffect } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateDocumentTitle } from "@/features/dashboard/actions/update-document-title.action";
import { toast } from "sonner";

interface DocumentRenameDialogProps {
  documentId: string;
  documentTitle: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function DocumentRenameDialog({
  documentId,
  documentTitle,
  isOpen,
  setIsOpen,
}: DocumentRenameDialogProps) {
  const [draftTitle, setDraftTitle] = useState(documentTitle);
  const [isPending, setIsPending] = useState(false);

  // Reset draft title when dialog opens
  useEffect(() => {
    if (isOpen) {
      setDraftTitle(documentTitle);
    }
  }, [isOpen, documentTitle]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newTitle = draftTitle;
    if (newTitle.trim() === documentTitle || newTitle.trim() === "") {
      setIsOpen(false);
      return;
    }

    setIsPending(true);
    try {
      await updateDocumentTitle(documentId, newTitle);
      setIsOpen(false);
      toast.success("Document renamed successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update title");
    } finally {
      setIsPending(false);
    }
  };

  const isSaveDisabled =
    isPending || draftTitle.trim() === "" || draftTitle.trim() === documentTitle;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="sm:max-w-[425px] p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="bg-zinc-50/50 dark:bg-zinc-900/50 p-6 border-b border-zinc-100 dark:border-zinc-800">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <Pencil className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div className="text-left">
                  <DialogTitle className="text-xl font-semibold">Rename Document</DialogTitle>
                  <DialogDescription className="mt-1.5 -ml-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100/50 dark:bg-zinc-800/50 px-2 py-1 rounded-md inline-block">
                    Enter a new name for your document.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              <Label htmlFor={`rename-${documentId}`} className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Document Title
              </Label>
              <Input
                id={`rename-${documentId}`}
                name="title"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="h-11 px-4 text-[15px] rounded-lg border-zinc-200 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:focus-visible:ring-zinc-600 shadow-sm bg-white dark:bg-zinc-950"
                autoFocus
                required
              />
            </div>
          </div>
          
          <DialogFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
              className="rounded-lg h-10 px-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </Button>
            
            <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-600 mx-1 hidden sm:block" />
            
            <Button 
              type="submit" 
              disabled={isSaveDisabled}
              className="relative bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm rounded-lg h-10 px-6 font-medium"
            >
              <span className={isPending ? "opacity-0" : ""}>Save</span>
              {isPending && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
