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
import { acceptRoleRequestAction } from "@/features/document/actions/accept-request.action";
import { rejectRoleRequestAction } from "@/features/document/actions/reject-request.action";
import { ROUTES } from "@/constants/routes";
import { getInitials } from "@/utils/string-utils";
import { extractUserInfo } from "@/utils/user-utils";
import type { UserLike } from "@/utils/user-utils";

// Supabase returns nested join rows as arrays even for many-to-one relationships.
// We model both possibilities and normalise at the access site.
type SupabaseOwner = UserLike | UserLike[] | null | undefined;
type SupabaseDocuments =
  | { title?: string | null; owner?: SupabaseOwner }
  | Array<{ title?: string | null; owner?: SupabaseOwner }>
  | null
  | undefined;

export interface InboxInvite {
  id: string;
  token: string;
  status: string;
  role: string;
  expires_at: string | null;
  created_at: string;
  document_id: string;
  documents?: SupabaseDocuments;
  requester?: UserLike;
}

export function InboxItem({ invite, onItemUpdate }: { invite: InboxInvite, onItemUpdate?: (updates: Partial<InboxInvite> & { _deleted?: boolean }) => void }) {
  const router = useRouter();
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isExpiredLocal, setIsExpiredLocal] = useState(() => {
    // Role requests do not expire in the UI
    if (invite.token?.startsWith("request:")) return false;
    
    return (
      invite.status === "expired" ||
      (invite.expires_at && new Date(invite.expires_at as string) < new Date())
    );
  });

  useEffect(() => {
    if (invite.status === "pending" && invite.expires_at && !isExpiredLocal) {
       
      const msUntilExpiry = new Date(invite.expires_at!).getTime() - Date.now();
      if (msUntilExpiry > 0) {
        const timeout = setTimeout(
          () => setIsExpiredLocal(true),
          msUntilExpiry,
        );
        return () => clearTimeout(timeout);
      }
      // Already expired — the state initializer handles this on mount.
      // No synchronous setState here to avoid cascading renders.
    }
  }, [invite.status, invite.expires_at, isExpiredLocal]);

  // formatting time
  const timeStr = format(new Date(invite.created_at), "hh:mm a");
  const dateStr = format(new Date(invite.created_at), "dd/MM/yyyy");

  // Dynamic expiry text
  let expiryText = "Expires soon";
  if (invite.expires_at && !invite.token?.startsWith("request:")) {
    // eslint-disable-next-line react-hooks/purity
    const hoursLeft = Math.max(0, Math.ceil((new Date(invite.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)));
    if (hoursLeft > 24) {
      expiryText = `Expires in ${Math.ceil(hoursLeft / 24)} days`;
    } else if (hoursLeft > 1) {
      expiryText = `Expires in ${hoursLeft} hours`;
    } else if (hoursLeft === 1) {
      expiryText = "Expires in 1 hour";
    } else {
      expiryText = "Expires in < 1 hour";
    }
  }

  // Normalise Supabase response: nested joins come back as arrays or single objects
  const docsRaw = invite.documents;
  const docsData = Array.isArray(docsRaw) ? docsRaw[0] : docsRaw;
  const ownerRaw = docsData?.owner;
  const ownerData = Array.isArray(ownerRaw) ? ownerRaw[0] : ownerRaw;
  const { name: inviterName, email: inviterEmail, image: inviterImage } = extractUserInfo(ownerData ?? {});
  const documentTitle = docsData?.title || "Untitled Document";

  let displayImage = inviterImage;
  let displayName = inviterName;
  let displayEmail = inviterEmail;
  let messageNode = null;

  if (invite.status === "exited") {
    messageNode = (
      <span className="text-[14px] text-zinc-700 dark:text-zinc-300 mb-1">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{invite.token}</span> has exited from <span className="font-semibold text-zinc-900 dark:text-zinc-100">&apos;{documentTitle}&apos;</span>.
      </span>
    );
  } else if (invite.status === "removed") {
    messageNode = (
      <span className="text-[14px] text-zinc-700 dark:text-zinc-300 mb-1">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{inviterName || inviterEmail}</span> has removed you from <span className="font-semibold text-zinc-900 dark:text-zinc-100">&apos;{documentTitle}&apos;</span>.
      </span>
    );
  } else if (invite.status === "role_updated") {
    messageNode = (
      <span className="text-[14px] text-zinc-700 dark:text-zinc-300 mb-1">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{inviterName || inviterEmail}</span> has updated your role for <span className="font-semibold text-zinc-900 dark:text-zinc-100">&apos;{documentTitle}&apos;</span> to <span className="font-semibold capitalize text-zinc-900 dark:text-zinc-100">{invite.role}</span>.
      </span>
    );
  } else if (invite.token?.startsWith("request-denied:")) {
    messageNode = (
      <span className="text-[14px] text-zinc-700 dark:text-zinc-300 mb-1">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{inviterName || inviterEmail}</span> has denied your request for <span className="font-semibold capitalize text-zinc-900 dark:text-zinc-100">{invite.role}</span> access for <span className="font-semibold text-zinc-900 dark:text-zinc-100">&apos;{documentTitle}&apos;</span>.
      </span>
    );
  } else if (invite.token?.startsWith("request:")) {
    const req = invite.requester;
    const fallbackEmail = invite.token.split(":")[2];
    const { name: reqName, email: reqEmail, image: reqImage } = extractUserInfo(req || { email: fallbackEmail });
    
    displayImage = reqImage;
    displayName = reqName;
    displayEmail = reqEmail;
    
    messageNode = (
      <span className="text-[14px] text-zinc-700 dark:text-zinc-300 mb-1">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{reqName || reqEmail}</span> has requested <span className="font-semibold capitalize text-zinc-900 dark:text-zinc-100">{invite.role}</span> access for <span className="font-semibold text-zinc-900 dark:text-zinc-100">&apos;{documentTitle}&apos;</span>.
      </span>
    );
  } else {
    messageNode = (
      <span className="text-[14px] text-zinc-700 dark:text-zinc-300 mb-1">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{inviterName || inviterEmail}</span> invited you to join <span className="font-semibold text-zinc-900 dark:text-zinc-100">&apos;{documentTitle}&apos;</span> with <span className="font-semibold capitalize text-zinc-900 dark:text-zinc-100">{invite.role}</span> access.
      </span>
    );
  }

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      if (invite.token?.startsWith("request:")) {
        const res = await acceptRoleRequestAction(invite.id);
        if (res.error) throw new Error(res.error);
      } else {
        await acceptInvite(invite.token);
      }
      toast.success(invite.token?.startsWith("request:") ? "Request accepted!" : "Invitation accepted!");
      if (onItemUpdate) onItemUpdate({ status: 'accepted' });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to accept");
    } finally {
      setIsLoading(false);
      setIsAcceptOpen(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      if (invite.token?.startsWith("request:")) {
        const res = await rejectRoleRequestAction(invite.id);
        if (res.error) throw new Error(res.error);
      } else {
        await rejectInvite(invite.id);
      }
      toast.success(invite.token?.startsWith("request:") ? "Request rejected." : "Invitation rejected.");
      if (onItemUpdate) onItemUpdate({ status: 'rejected' });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reject");
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
      if (onItemUpdate) onItemUpdate({ _deleted: true }); // special flag to remove it
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove invite");
    } finally {
      setIsLoading(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <div
      className={`py-4 px-5 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-all duration-300 group relative overflow-hidden ${isExpiredLocal && invite.status === "pending" ? "opacity-75 grayscale-[0.5]" : "hover:border-indigo-500/40 dark:hover:border-indigo-500/40 hover:shadow-md hover:-translate-y-0.5"}`}
    >
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] pointer-events-none mix-blend-overlay"></div>
      <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-between">
        <div
          className={`flex gap-4 items-start sm:items-center flex-1 min-w-0 ${isExpiredLocal && invite.status === "pending" ? "opacity-50 grayscale-[0.3]" : ""}`}
        >
          <Avatar className="w-10 h-10 shrink-0 border-2 border-white shadow-sm mt-1 sm:mt-0">
            <AvatarImage src={displayImage} alt={displayName} />
            <AvatarFallback className="bg-zinc-100 text-zinc-600 font-medium text-xs">
              {getInitials(displayName, displayEmail)}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col justify-center flex-1 min-w-0">
            {messageNode}
          </div>
      </div>
        
      <div className="flex flex-col items-start sm:items-end justify-between gap-2 shrink-0 sm:min-w-[180px] mt-2 sm:mt-0">
        {/* Top Right: Badges & Date */}
        <div
          className={`flex items-center gap-3 ${isExpiredLocal && invite.status === "pending" ? "opacity-50 grayscale-[0.3]" : ""}`}
        >
          {invite.status === "accepted" && (
            <span className="flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Accepted
            </span>
          )}
          {invite.status === "rejected" && (
            <span className="flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700">
              <XCircle className="w-3 h-3 mr-1" />
              Rejected
            </span>
          )}
          {invite.status === "removed" && (
            <span className="flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700">
              <XCircle className="w-3 h-3 mr-1" />
              Access Revoked
            </span>
          )}
          {invite.status === "exited" && (
            <span className="flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700">
              <XCircle className="w-3 h-3 mr-1" />
              Member Left
            </span>
          )}
          {invite.status === "role_updated" && (
            <span className="flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Role Updated
            </span>
          )}
          {isExpiredLocal && invite.status === "pending" && (
            <span className="flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700">
              <XCircle className="w-3 h-3 mr-1" />
              Expired
            </span>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-400">
              {timeStr}
            </span>
            <div className="h-[16px] w-[1px] bg-zinc-300 dark:bg-zinc-700 shrink-0" />
            <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-400">
              {dateStr}
            </span>
          </div>
        </div>

        {/* Bottom Right: Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 w-full mt-1 min-h-[28px]">
          {invite.status === "pending" && !isExpiredLocal && (
            <>
              {!invite.token?.startsWith("request:") && (
                <span className="text-[10.5px] text-red-500 mr-1.5 hidden sm:inline-block whitespace-nowrap">
                  {expiryText}
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-[84px] text-xs border-zinc-200"
                onClick={() => setIsRejectOpen(true)}
                disabled={isLoading}
              >
                Reject
              </Button>
              <Button
                size="sm"
                className={`h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm ${invite.token?.startsWith("request:") ? "w-[92px]" : "w-[84px]"}`}
                onClick={() => setIsAcceptOpen(true)}
                disabled={isLoading}
              >
                {invite.token?.startsWith("request:") ? "Update Role" : "Accept"}
              </Button>
            </>
          )}

          {invite.status === "accepted" && !invite.token?.startsWith("request:") && (
            <Button
              size="sm"
              className="h-7 w-7 p-0 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm shrink-0"
              onClick={() => router.push(ROUTES.DOCUMENT(invite.document_id))}
              title="Go to Document"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}

          {(invite.status !== "pending" || isExpiredLocal) && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-50"
              onClick={() => setIsDeleteOpen(true)}
              disabled={isLoading}
              title="Remove from Inbox"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

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
    </div>
  );
}
