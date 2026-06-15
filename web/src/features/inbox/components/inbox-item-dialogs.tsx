import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface InboxItemDialogsProps {
  isAcceptOpen: boolean;
  setIsAcceptOpen: (open: boolean) => void;
  isRejectOpen: boolean;
  setIsRejectOpen: (open: boolean) => void;
  isDeleteOpen: boolean;
  setIsDeleteOpen: (open: boolean) => void;
  isLoading: boolean;
  documentTitle: string;
  role: string;
  onAccept: () => void;
  onReject: () => void;
  onDelete: () => void;
}

export function InboxItemDialogs({
  isAcceptOpen,
  setIsAcceptOpen,
  isRejectOpen,
  setIsRejectOpen,
  isDeleteOpen,
  setIsDeleteOpen,
  isLoading,
  documentTitle,
  role,
  onAccept,
  onReject,
  onDelete,
}: InboxItemDialogsProps) {
  return (
    <>
      <AlertDialog open={isAcceptOpen} onOpenChange={setIsAcceptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to join <span className="text-indigo-600 dark:text-indigo-400 font-semibold">'{documentTitle}'</span> as an <span className="text-indigo-600 dark:text-indigo-400 font-semibold capitalize">{role}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); onAccept(); }} 
              disabled={isLoading} 
              className="relative bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-md rounded-xl font-medium transition-all hover:-translate-y-0.5"
            >
              <span className={isLoading ? "opacity-0" : ""}>Accept</span>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject the invitation to join '{documentTitle}'?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); onReject(); }} 
              disabled={isLoading} 
              className="relative shadow-md rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white transition-all hover:-translate-y-0.5"
            >
              <span className={isLoading ? "opacity-0" : ""}>Reject</span>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete from Inbox?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the invitation record from your inbox.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); onDelete(); }} 
              disabled={isLoading} 
              className="relative shadow-md rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white transition-all hover:-translate-y-0.5"
            >
              <span className={isLoading ? "opacity-0" : ""}>Delete</span>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
