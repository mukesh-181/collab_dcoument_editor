"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { InboxItemDialogs } from "./inbox-item-dialogs";

import { acceptInvite } from "@/features/invites/actions/accept-invite.action";
import { rejectInvite } from "@/features/invites/actions/reject-invite.action";
import { deleteInvite } from "@/features/invites/actions/delete-invite.action";
import { ROUTES } from "@/constants/routes";
import { getInitials } from "@/utils/string-utils";
import { getUserName, getUserImage, getUserEmail, getUserRole, USER_FALLBACKS } from "@/utils/user-utils";



export function InboxItem({ invite }: { invite: any }) {
  const router = useRouter();
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isExpiredLocal, setIsExpiredLocal] = useState(() => {
    return invite.status === 'expired' || (invite.expires_at && new Date(invite.expires_at) < new Date());
  });

  useEffect(() => {
    if (invite.status === 'pending' && invite.expires_at && !isExpiredLocal) {
      const msUntilExpiry = new Date(invite.expires_at).getTime() - Date.now();
      if (msUntilExpiry > 0) {
        const timeout = setTimeout(() => setIsExpiredLocal(true), msUntilExpiry);
        return () => clearTimeout(timeout);
      } else {
        setIsExpiredLocal(true);
      }
    }
  }, [invite.status, invite.expires_at, isExpiredLocal]);

  // formatting time
  const timeStr = format(new Date(invite.created_at), "hh:mm a");
  const dateStr = format(new Date(invite.created_at), "dd/MM/yyyy");

  const inviterEmail = getUserEmail(invite.documents?.owner?.email);
  const inviterName = getUserName(invite.documents?.owner?.name, inviterEmail);
  const inviterImage = getUserImage(invite.documents?.owner?.image);
  const documentTitle = invite.documents?.title || "Untitled Document";

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await acceptInvite(invite.token);
      toast.success("Invitation accepted!");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to accept invite");
    } finally {
      setIsLoading(false);
      setIsAcceptOpen(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await rejectInvite(invite.id);
      toast.success("Invitation rejected.");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to reject invite");
    } finally {
      setIsLoading(false);
      setIsRejectOpen(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteInvite(invite.id);
      toast.success("Invitation removed.");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to remove invite");
    } finally {
      setIsLoading(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <div className={`py-5 px-5 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm transition-colors group relative ${isExpiredLocal && invite.status === 'pending' ? 'bg-zinc-50/50 dark:bg-zinc-900/20' : 'hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
      
      <div className={`flex gap-4 items-center ${isExpiredLocal && invite.status === 'pending' ? 'opacity-50 grayscale-[0.3]' : ''}`}>
        <Avatar className="w-10 h-10 shrink-0 border border-zinc-200 dark:border-zinc-800">
          <AvatarImage src={inviterImage} alt={inviterName} />
          <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
            {getInitials(inviterName, inviterEmail)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col flex-1 min-w-0 pr-28">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="font-semibold text-[16px] text-zinc-900 dark:text-zinc-100 truncate">
              {inviterName}
            </span>
            {inviterEmail && (
              <>
                <div className="h-[18px] w-[1px] bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                <span className="text-[13px] text-zinc-500 truncate">
                  {inviterEmail}
                </span>
              </>
            )}
          </div>
          
          {invite.status === 'exited' ? (
            <span className="text-[14px] text-zinc-700 dark:text-zinc-300 mb-1">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{invite.token}</span> has exited from <span className="font-semibold text-zinc-900 dark:text-zinc-100">'{documentTitle}'</span>.
            </span>
          ) : invite.status === 'removed' ? (
            <span className="text-[14px] text-zinc-700 dark:text-zinc-300 mb-1">
              You have been removed from <span className="font-semibold">'{documentTitle}'</span> by <span className="font-semibold">{inviterName}</span>
            </span>
          ) : invite.status === 'role_updated' ? (
            <span className="text-[14px] text-zinc-700 dark:text-zinc-300 mb-1 flex flex-col">
              <span>Your role for <span className="font-semibold">'{documentTitle}'</span> has been updated to <span className="font-semibold capitalize">{invite.role}</span> by <span className="font-semibold">{inviterName}</span>.</span>
            
            </span>
          ) : (
            <span className="text-[14px] text-zinc-700 dark:text-zinc-300 mb-1">
              Invitation to join <span className="font-semibold">'{documentTitle}'</span> with <span className="font-semibold capitalize">{invite.role}</span> access
            </span>
          )}
          
          {invite.status === 'pending' && !isExpiredLocal && (
            <span className="text-[12px]  text-red-500 dark:text-zinc-400">
              This invitation will expire in 24 hours.
            </span>
          )}
        </div>
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-3">
        <div className={`flex items-center gap-3 ${isExpiredLocal && invite.status === 'pending' ? 'opacity-50 grayscale-[0.3]' : ''}`}>
          {invite.status === 'accepted' && (
            <span className="flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Accepted
            </span>
          )}
          {invite.status === 'rejected' && (
            <span className="flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">
              <XCircle className="w-3 h-3 mr-1" />
              Rejected
            </span>
          )}
          {invite.status === 'removed' && (
            <span className="flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">
              <XCircle className="w-3 h-3 mr-1" />
              Access Revoked
            </span>
          )}
          {invite.status === 'exited' && (
            <span className="flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800/10 dark:text-zinc-400">
              <XCircle className="w-3 h-3 mr-1" />
              Member Left
            </span>
          )}
          {invite.status === 'role_updated' && (
            <span className="flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Role Updated
            </span>
          )}
          {isExpiredLocal && invite.status === 'pending' && (
            <span className="flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800/10 dark:text-zinc-400">
              <XCircle className="w-3 h-3 mr-1" />
              Expired
            </span>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300">
              {timeStr}
            </span>
            <div className="h-[16px] w-[1px] bg-zinc-300 dark:bg-zinc-700 shrink-0" />
            <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300">
              {dateStr}
            </span>
          </div>
        </div>

        {(invite.status !== 'pending' || isExpiredLocal) && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 w-7 p-0 ml-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
            onClick={() => setIsDeleteOpen(true)}
            disabled={isLoading}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
        
      {invite.status === 'pending' && !isExpiredLocal && (
        <div className="absolute bottom-4 right-4 flex flex-col items-end">
          <div className="flex items-center gap-2.5">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 w-[84px] text-xs border-zinc-200 dark:border-zinc-700"
              onClick={() => setIsRejectOpen(true)}
              disabled={isLoading}
            >
              Reject
            </Button>
            <Button 
              size="sm" 
              className="h-7 w-[84px] text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900"
              onClick={() => setIsAcceptOpen(true)}
              disabled={isLoading}
            >
              Accept
            </Button>
          </div>
        </div>
      )}

      {invite.status === 'accepted' && (
        <div className="absolute bottom-4 right-4 flex flex-col items-end">
          <Button 
            size="sm" 
            className="h-7 px-4 text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900"
            onClick={() => router.push(ROUTES.DOCUMENT(invite.document_id))}
          >
            Go to Document
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      )}

      <InboxItemDialogs
        isAcceptOpen={isAcceptOpen}
        setIsAcceptOpen={setIsAcceptOpen}
        isRejectOpen={isRejectOpen}
        setIsRejectOpen={setIsRejectOpen}
        isDeleteOpen={isDeleteOpen}
        setIsDeleteOpen={setIsDeleteOpen}
        isLoading={isLoading}
        documentTitle={documentTitle}
        role={invite.role}
        onAccept={handleAccept}
        onReject={handleReject}
        onDelete={handleDelete}
      />
    </div>
  );
}
