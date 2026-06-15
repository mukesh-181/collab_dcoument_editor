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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { updateDocumentTitle } from "@/features/dashboard/actions/update-document-title.action";

interface DocumentRenameDialogProps {
  documentId: string;
  initialTitle: string;
  onTitleUpdate: (newTitle: string) => void;
}

export function DocumentRenameDialog({
  documentId,
  initialTitle,
  onTitleUpdate,
}: DocumentRenameDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [draftTitle, setDraftTitle] = useState(initialTitle);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newTitle = draftTitle;
    if (newTitle.trim() === initialTitle || newTitle.trim() === "") {
      setOpen(false);
      return;
    }

    setIsPending(true);
    try {
      await updateDocumentTitle(documentId, newTitle);
      onTitleUpdate(newTitle);
      setOpen(false);
      toast.success("Document renamed successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update title");
    } finally {
      setIsPending(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setDraftTitle(initialTitle);
    }
  };

  const isSaveDisabled =
    isPending || draftTitle.trim() === "" || draftTitle.trim() === initialTitle;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center -ml-1"
        >
          <Pencil className="h-1 w-1" />
          <span className="sr-only">Rename document</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-2xl">
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
              <Label htmlFor="title" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Document Title
              </Label>
              <Input
                id="title"
                name="title"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="h-11 px-4 text-[15px] rounded-xl border-zinc-200/60 focus-visible:ring-indigo-500/50 dark:border-zinc-800/60 dark:focus-visible:ring-indigo-500/50 shadow-sm bg-white/50 dark:bg-zinc-950/50"
                autoFocus
                required
              />
            </div>
          </div>
          
          <DialogFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="rounded-lg h-10 px-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </Button>
            
            <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-600 mx-1 hidden sm:block" />
            
            <Button 
              type="submit" 
              disabled={isSaveDisabled}
              className="relative bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-md rounded-xl h-10 px-6 font-medium transition-all hover:-translate-y-0.5"
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
