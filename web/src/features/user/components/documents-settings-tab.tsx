"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { getUserDocuments } from "@/features/dashboard/actions/get-user-documents.action";
import { getDocumentById } from "@/features/document/actions/get-document-by-id.action";
import { removeMemberAction } from "@/features/document/actions/remove-member.action";
import { revokeInviteAction } from "@/features/invites/actions/revoke-invite.action";
import { leaveDocumentAction } from "@/features/document/actions/leave-document.action";
import { requestRoleChangeAction } from "@/features/document/actions/request-role-change.action";
import { checkPendingRequestAction } from "@/features/document/actions/check-pending-request.action";
import { DocumentDeleteDialog } from "@/features/dashboard/components/dialogs/document-delete-dialog";
import { LeaveDocumentDialog } from "@/features/document/components/page/leave-document-dialog";
import { RemoveMemberDialog } from "@/features/document/components/page/remove-member-dialog";
import { RevokeInviteDialog } from "@/features/document/components/page/revoke-invite-dialog";
import { FileText, ArrowLeft, Trash2, Users, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { extractUserInfo } from "@/utils/user-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/utils/string-utils";
import useSWRInfinite from "swr/infinite";
import { useSWRConfig } from "swr";
import { createClient } from "@/lib/supabase/client";
import { DocumentListRealtimeListener } from "@/features/dashboard/components/layout/document-list-realtime-listener";

interface DocumentsSettingsTabProps {
  user: User;
}

interface DocumentMember {
  role: string;
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
}

interface DocumentInvite {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface DocumentItem {
  id: string;
  title: string;
  created_at: string;
  document_members?: DocumentMember[];
  all_members?: DocumentMember[];
  invites?: DocumentInvite[];
}

type FilterType = "all" | "owner" | "editor" | "viewer";

export function DocumentsSettingsTab({ user }: DocumentsSettingsTabProps) {
  const { mutate: globalMutate } = useSWRConfig();
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  
  const getKey = (pageIndex: number, previousPageData: { documents: DocumentItem[], totalCount: number } | null) => {
    if (previousPageData && (!previousPageData.documents || previousPageData.documents.length < 10)) return null;
    return ['user-documents', filter, pageIndex];
  };

  const fetcher = async (args: [string, string, number]) => {
    const [, currentFilter, pageIndex] = args;
    return await getUserDocuments({ 
      filter: currentFilter === 'all' ? 'all' : (currentFilter === 'owner' ? 'owned-by-me' : currentFilter as 'editor' | 'viewer' | 'all' | 'owned-by-me'), 
      page: pageIndex + 1,
      limit: 10 
    });
  };

  const { data, error, size, setSize, mutate } = useSWRInfinite(
    getKey,
    fetcher,
    { 
      revalidateOnFocus: false
      // Removed revalidateIfStale: false so switching tabs fetches fresh data
    }
  );

  const documents = data ? data.flatMap(d => d.documents as unknown as DocumentItem[]) : [];
  const totalCount = data?.[0]?.totalCount ?? 0;
  const loading = !data && !error && !selectedDocId;
  const isLoadingMore = loading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isReachingEnd = (data?.[data.length - 1]?.documents?.length ?? 0) < 10;

  const loadMore = useCallback(() => {
    if (isLoadingMore || isReachingEnd) return;
    setSize(size + 1);
  }, [isLoadingMore, isReachingEnd, setSize, size]);
  
  const [docDetails, setDocDetails] = useState<DocumentItem | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Record<string, boolean>>({});
  const [isRequestingRole, setIsRequestingRole] = useState(false);

  const [deleteDialogData, setDeleteDialogData] = useState<{ isOpen: boolean; docId: string; title: string }>({ isOpen: false, docId: "", title: "" });
  const [leaveDialogData, setLeaveDialogData] = useState<{ isOpen: boolean; docId: string; title: string; ownerEmail: string }>({ isOpen: false, docId: "", title: "", ownerEmail: "" });
  const [removeDialogData, setRemoveDialogData] = useState<{ isOpen: boolean; memberId: string; memberEmail: string; memberName: string }>({ isOpen: false, memberId: "", memberEmail: "", memberName: "" });
  const [revokeDialogData, setRevokeDialogData] = useState<{ isOpen: boolean; inviteId: string; email: string }>({ isOpen: false, inviteId: "", email: "" });

  const observer = useRef<IntersectionObserver | null>(null);
  const triggerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingMore) return;
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isReachingEnd) {
          loadMore();
        }
      });
      
      if (node) observer.current.observe(node);
    },
    [isLoadingMore, isReachingEnd, loadMore]
  );

  const loadDocDetails = useCallback(async (id: string) => {
    setSelectedDocId(id);
    setDetailsLoading(true);
    try {
      const details = await getDocumentById(id);
      setDocDetails(details);
      
      // Check for pending requests if viewer
      if (details) {
        const role = details.document_members?.[0]?.role;
        if (role === 'viewer') {
          const res = await checkPendingRequestAction(id);
          setPendingRequests(prev => ({ ...prev, [id]: res.isPending }));
        } else {
          setPendingRequests(prev => ({ ...prev, [id]: false }));
        }
      }
    } catch {
      toast.error("Failed to load document details");
      setSelectedDocId(null);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const fetchDocuments = useCallback(() => {
    // 1. Refetch the currently active tab
    mutate();
    
    // 2. Clear cache for all other tabs (swr/infinite serializes keys to strings starting with $inf$)
    globalMutate((key) => {
      if (typeof key === 'string' && key.includes('user-documents')) return true;
      if (Array.isArray(key) && key[0] === 'user-documents') return true;
      return false;
    });
    
    // 3. Reload open document details if any
    if (selectedDocId) {
      loadDocDetails(selectedDocId);
    }
  }, [globalMutate, mutate, selectedDocId, loadDocDetails]);

  useEffect(() => {
    if (!selectedDocId) return;
    
    let isMounted = true;
    const supabase = createClient();
    
    const channel = supabase
      .channel(`settings-invites-${selectedDocId}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invites', filter: `document_id=eq.${selectedDocId}` },
        () => {
          if (isMounted) {
            loadDocDetails(selectedDocId);
          }
        }
      )
      .subscribe();
      
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    }
  }, [selectedDocId, loadDocDetails]);

  const handleConfirmRemoveMember = async () => {
    if (!docDetails) return;
    try {
      const res = await removeMemberAction(docDetails.id, removeDialogData.memberId, removeDialogData.memberEmail);
      if (res.error) throw new Error(res.error);
      toast.success("Member removed");
      loadDocDetails(docDetails.id); // reload
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to remove member");
      throw e;
    }
  };

  const handleRevokeInvite = (inviteId: string, email: string) => {
    setRevokeDialogData({ isOpen: true, inviteId, email });
  };

  const handleConfirmRevokeInvite = async () => {
    if (!docDetails) return;
    try {
      const res = await revokeInviteAction(revokeDialogData.inviteId, docDetails.id);
      if (res.error) throw new Error(res.error);
      toast.success("Invite revoked");
      loadDocDetails(docDetails.id); // reload
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to revoke invite");
      throw e;
    }
  };

  const handleLeave = async () => {
    if (!docDetails) return;
    const owner = docDetails.all_members?.find((m) => m.role === 'owner');
    if (!owner) return toast.error("Owner not found");
    
    setLeaveDialogData({ isOpen: true, docId: docDetails.id, title: docDetails.title, ownerEmail: owner.user.email });
  };

  const handleConfirmLeave = async () => {
    try {
      const res = await leaveDocumentAction(leaveDialogData.docId, leaveDialogData.ownerEmail, user.email || '');
      if (res.error) throw new Error(res.error);
      toast.success("Left document");
      mutate();
      if (selectedDocId === leaveDialogData.docId) {
        setSelectedDocId(null);
      }
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to leave");
      throw e; // throw so dialog stays open or handles loading state correctly
    }
  };

  const handleRequestRole = async () => {
    if (!docDetails) return;
    setIsRequestingRole(true);
    try {
      const res = await requestRoleChangeAction(docDetails.id, 'editor');
      if (res.error) throw new Error(res.error);
      toast.success("Role upgrade request sent");
      setPendingRequests(prev => ({ ...prev, [docDetails.id]: true }));
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to request role change");
    } finally {
      setIsRequestingRole(false);
    }
  };

  const handleListDelete = async (e: React.MouseEvent, doc: DocumentItem, role: string) => {
    e.stopPropagation();
    
    if (role === 'owner') {
      setDeleteDialogData({ isOpen: true, docId: doc.id, title: doc.title });
    } else {
      const owner = doc.all_members?.find((m) => m.role === 'owner');
      if (!owner) {
        toast.error("Owner not found");
        return;
      }
      setLeaveDialogData({ isOpen: true, docId: doc.id, title: doc.title, ownerEmail: owner.user.email });
    }
  };

  if (selectedDocId) {
    if (detailsLoading || !docDetails) {
      return (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      );
    }

    const myRole = docDetails.document_members?.[0]?.role;
    const isOwner = myRole === 'owner';

    // Sort members to make owner top
    const sortedMembers = [...(docDetails.all_members || [])].sort((a, b) => {
      if (a.role === 'owner') return -1;
      if (b.role === 'owner') return 1;
      return 0;
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedDocId(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{docDetails.title}</h3>
            <p className="text-sm text-zinc-500">Your role: <span className="font-bold capitalize ">{myRole}</span></p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-b-2 border-zinc-200 dark:border-zinc-800 pb-2">
          <Link href={`/dashboard/${docDetails.id}`}>
            <Button variant="secondary" size="sm" className="gap-2">
              Open Document <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>

          {!isOwner && (
            <>
              {myRole === 'viewer' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRequestRole}
                  disabled={isRequestingRole || pendingRequests[docDetails.id]}
                  className="relative"
                >
                  <span className={isRequestingRole ? "opacity-0" : ""}>
                    {pendingRequests[docDetails.id] ? "Editor Access Requested (Pending)" : "Request Editor Access"}
                  </span>
                  {isRequestingRole && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                    </div>
                  )}
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={handleLeave}>Leave Document</Button>
            </>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Users className="w-4 h-4" /> Team Members
          </h4>
          <div className="space-y-2 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            {sortedMembers.map((member) => {
              const info = extractUserInfo(member.user);
              return (
                <div key={member.user.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 border-b-2 border-zinc-200 dark:border-zinc-800 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border-2 border-white dark:border-zinc-800">
                      <AvatarImage src={info.image} />
                      <AvatarFallback>{getInitials(info.name, info.email)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{info.name}</p>
                      <p className="text-xs text-zinc-500">{info.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border-2 ${
                      member.role === 'owner' ? "bg-purple-400/15 text-purple-500 border-purple-500/30" :
                      member.role === 'editor' ? "bg-blue-400/15 text-blue-500 border-blue-500/30" :
                      "bg-gray-400/15 text-gray-500 border-gray-500/30"
                    }`}>
                      {member.role}
                    </span>
                    {isOwner && member.role !== 'owner' && (
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setRemoveDialogData({ isOpen: true, memberId: member.user.id, memberEmail: info.email, memberName: info.name })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isOwner && (docDetails.invites?.length ?? 0) > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Users className="w-4 h-4" /> Pending Invites
            </h4>
            <div className="space-y-2 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              {docDetails.invites?.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 border-b-2 border-zinc-200 dark:border-zinc-800 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium">{invite.email}</p>
                    <p className="text-xs text-zinc-500 mt-1">Sent {new Date(invite.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border-2 ${
                      invite.role === 'owner' ? "bg-purple-400/15 text-purple-500 border-purple-500/30" :
                      invite.role === 'editor' ? "bg-blue-400/15 text-blue-500 border-blue-500/30" :
                      "bg-gray-400/15 text-gray-500 border-gray-500/30"
                    }`}>
                      {invite.role}
                    </span>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleRevokeInvite(invite.id, invite.email)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DocumentDeleteDialog 
          isOpen={deleteDialogData.isOpen} 
          setIsOpen={(isOpen) => setDeleteDialogData(prev => ({ ...prev, isOpen }))} 
          documentId={deleteDialogData.docId} 
          documentTitle={deleteDialogData.title} 
          onSuccess={fetchDocuments} 
        />
        
        <LeaveDocumentDialog 
          isOpen={leaveDialogData.isOpen} 
          setIsOpen={(isOpen) => setLeaveDialogData(prev => ({ ...prev, isOpen }))} 
          documentTitle={leaveDialogData.title} 
          onConfirm={handleConfirmLeave} 
        />
        
        <RemoveMemberDialog
          isOpen={removeDialogData.isOpen}
          setIsOpen={(isOpen) => setRemoveDialogData(prev => ({ ...prev, isOpen }))}
          memberName={removeDialogData.memberName}
          onConfirm={handleConfirmRemoveMember}
        />
        
        <RevokeInviteDialog
          isOpen={revokeDialogData.isOpen}
          setIsOpen={(isOpen) => setRevokeDialogData(prev => ({ ...prev, isOpen }))}
          inviteEmail={revokeDialogData.email}
          onConfirm={handleConfirmRevokeInvite}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DocumentListRealtimeListener userId={user.id} onNewEvent={fetchDocuments} />
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          My Documents <span className="text-zinc-500 text-sm font-medium ml-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">&nbsp; {totalCount}&nbsp; Documents</span>
        </h3>
        <p className="text-sm text-zinc-500">Manage all your documents and collaborators.</p>
      </div>

      <div className="flex gap-2 border-b-2 border-zinc-200 dark:border-zinc-800 pb-2">
        {["all", "owner", "editor", "viewer"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as FilterType)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
              filter === f
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">
          No documents found.
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc, index) => {
            const role = doc.document_members?.[0]?.role || "viewer";
            const isTrigger = index === documents.length - 3; // Trigger on the 7th item of a 10-item batch
            
            return (
              <div
                key={doc.id}
                ref={isTrigger ? triggerRef : null}
                onClick={() => loadDocDetails(doc.id)}
                className="group flex items-center justify-between p-4 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:border-indigo-500/50 transition-all bg-white dark:bg-zinc-900/50 gap-4"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{doc.title}</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      Created {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <Link href={`/dashboard/${doc.id}`} onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30" 
                      title="Open Document"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border-2 ${
                    role === 'owner' ? "bg-purple-400/15 text-purple-500 border-purple-500/30" :
                    role === 'editor' ? "bg-blue-400/15 text-blue-500 border-blue-500/30" :
                    "bg-gray-400/15 text-gray-500 border-gray-500/30"
                  }`}>
                    {role}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={(e) => handleListDelete(e, doc, role)}
                    title={role === 'owner' ? "Delete Document" : "Leave Document"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          )}
        </div>
      )}

      <DocumentDeleteDialog 
        isOpen={deleteDialogData.isOpen} 
        setIsOpen={(isOpen) => setDeleteDialogData(prev => ({ ...prev, isOpen }))} 
        documentId={deleteDialogData.docId} 
        documentTitle={deleteDialogData.title} 
        onSuccess={fetchDocuments} 
      />
      
      <LeaveDocumentDialog 
        isOpen={leaveDialogData.isOpen} 
        setIsOpen={(isOpen) => setLeaveDialogData(prev => ({ ...prev, isOpen }))} 
        documentTitle={leaveDialogData.title} 
        onConfirm={handleConfirmLeave} 
      />
    </div>
  );
}
