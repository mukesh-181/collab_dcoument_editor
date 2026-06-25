"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteDocument } from "@/features/dashboard/actions/delete-document.action";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface DocumentDeleteDialogProps {
  documentId: string;
  documentTitle: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess?: () => void;
}

export function DocumentDeleteDialog({
  documentId,
  documentTitle,
  isOpen,
  setIsOpen,
  onSuccess,
}: DocumentDeleteDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    setIsPending(true);
    try {
      await deleteDocument(documentId);
      setIsOpen(false);
      toast.success("Document deleted");
      onSuccess?.();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete document");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="sm:max-w-[500px] p-0 overflow-hidden border-border rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border shadow-sm">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-xl font-semibold">Delete Document</DialogTitle>
                <DialogDescription className="mt-1.5 text-[13px] font-medium text-muted-foreground">
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col gap-3">
            <p className="text-[15px] text-foreground">
              Are you sure you want to delete <span className="font-semibold">{documentTitle}</span>?
            </p>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-3.5 rounded-lg flex items-start gap-3 mt-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
              <p className="text-[14px] font-medium text-red-800 dark:text-red-300">
                All collaborators will lose access if this document is deleted.
              </p>
            </div>
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
            type="button" 
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
            className="relative shadow-md rounded-xl h-10 px-6 font-medium bg-red-600 hover:bg-red-700 text-white transition-all hover:-translate-y-0.5"
          >
            <span className={isPending ? "opacity-0" : ""}>Delete Document</span>
            {isPending && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
