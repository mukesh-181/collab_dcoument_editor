"use client";

import { useState } from "react";
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
  if (isOpen && draftTitle !== documentTitle) {
    setDraftTitle(documentTitle);
  }

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
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update title");
    } finally {
      setIsPending(false);
    }
  };

  const isSaveDisabled =
    isPending || draftTitle.trim() === "" || draftTitle.trim() === documentTitle;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="sm:max-w-[425px] p-0 overflow-hidden border-border rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border shadow-sm">
                  <Pencil className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <DialogTitle className="text-xl font-semibold">Rename Document</DialogTitle>
                  <DialogDescription className="mt-1.5 text-[13px] font-medium text-muted-foreground">
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
                className="h-11 px-4 text-[15px] rounded-xl border-zinc-200/60 focus-visible:ring-purple-500/50 dark:border-zinc-800/60 dark:focus-visible:ring-purple-500/50 shadow-sm bg-white/50 dark:bg-zinc-950/50"
                autoFocus
                required
              />
            </div>
          </div>
          
          <DialogFooter className="p-4 flex items-center justify-end gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
              className="rounded-lg h-10 px-4 hover:bg-accent transition-colors"
            >
              Cancel
            </Button>
            
            <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
            
            <Button 
              type="submit" 
              disabled={isSaveDisabled}
              className="relative bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-xl h-10 px-6 font-medium transition-all hover:-translate-y-0.5"
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
