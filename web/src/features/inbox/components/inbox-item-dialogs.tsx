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
              You are about to join '{documentTitle}' as an {role}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); onAccept(); }} 
              disabled={isLoading} 
              className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {isLoading ? "Accepting..." : "Accept"}
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
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); onReject(); }} 
              disabled={isLoading} 
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isLoading ? "Rejecting..." : "Reject"}
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
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); onDelete(); }} 
              disabled={isLoading} 
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
