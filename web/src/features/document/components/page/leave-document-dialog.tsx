"use client";

import { useState } from "react";
import { LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LeaveDocumentDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  documentTitle: string;
  onConfirm: () => Promise<void>;
}

export function LeaveDocumentDialog({
  isOpen,
  setIsOpen,
  documentTitle,
  onConfirm,
}: LeaveDocumentDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const handleLeave = async () => {
    setIsPending(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="sm:max-w-[500px] p-0 overflow-hidden border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-zinc-50/50 dark:bg-zinc-900/50 p-6 border-b border-zinc-100 dark:border-zinc-800">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <LogOut className="h-5 w-5 text-amber-500" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-xl font-semibold">Leave Document</DialogTitle>
                <DialogDescription className="mt-1.5 -ml-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100/50 dark:bg-zinc-800/50 px-2 py-1 rounded-md inline-block">
                  You will lose access to this document.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col gap-3">
            <p className="text-[15px] text-zinc-700 dark:text-zinc-300">
              Are you sure you want to leave <span className="font-semibold text-zinc-900 dark:text-zinc-100">{documentTitle}</span>?
            </p>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-lg flex items-start gap-3 mt-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[14px] font-medium text-amber-800 dark:text-amber-300">
                You will need to be re-invited by the owner to regain access.
              </p>
            </div>
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
            type="button" 
            disabled={isPending}
            onClick={handleLeave}
            className="relative shadow-md rounded-xl h-10 px-6 font-medium bg-amber-600 hover:bg-amber-700 text-white transition-all hover:-translate-y-0.5"
          >
            <span className={isPending ? "opacity-0" : ""}>Leave Document</span>
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
