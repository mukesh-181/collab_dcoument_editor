"use client";

import { useState } from "react";
import { MailX, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RevokeInviteDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  inviteEmail: string;
  onConfirm: () => Promise<void>;
}

export function RevokeInviteDialog({
  isOpen,
  setIsOpen,
  inviteEmail,
  onConfirm,
}: RevokeInviteDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const handleRevoke = async () => {
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
        className="sm:max-w-[500px] p-0 overflow-hidden border-border rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border shadow-sm">
                <MailX className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-xl font-semibold">Revoke Invite</DialogTitle>
                <DialogDescription className="mt-1.5 text-[13px] font-medium text-muted-foreground">
                  Cancel pending invitation.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col gap-3">
            <p className="text-[15px] text-foreground">
              Are you sure you want to revoke the invite for <span className="font-semibold">{inviteEmail}</span>?
            </p>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-3.5 rounded-lg flex items-start gap-3 mt-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
              <p className="text-[14px] font-medium text-red-800 dark:text-red-300">
                This link or email invite will immediately become invalid.
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
            onClick={handleRevoke}
            className="relative shadow-md rounded-xl h-10 px-6 font-medium bg-red-600 hover:bg-red-700 text-white transition-all hover:-translate-y-0.5"
          >
            <span className={isPending ? "opacity-0" : ""}>Revoke Invite</span>
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
