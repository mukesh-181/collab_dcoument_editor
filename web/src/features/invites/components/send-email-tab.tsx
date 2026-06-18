"use client";

import { useState } from "react";
import { Send, Eye, Edit2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserSearchInput, SelectedContact } from "./user-search-input";
import { sendEmailInvites } from "../actions/send-email-invites.action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { extractUserInfo } from "@/utils/user-utils";
import { getInitials } from "@/utils/string-utils";
import { sendMail } from "../actions/sendgrid.action";

interface Member {
  user: { id: string; email?: string; name?: string; image?: string; user_metadata?: Record<string, string> };
  role: string;
}

interface PendingInvite {
  id?: string;
  email: string;
  status: string;
  expires_at: string;
  role?: string;
}

interface NewInvite {
  email: string;
  status: string;
  expires_at: string;
}

export function SendEmailTab({ 
  documentId,
  allMembers = [],
  invites = [],
  onInviteSent
}: { 
  documentId: string;
  allMembers?: Member[];
  invites?: PendingInvite[];
  onInviteSent?: (newInvites: NewInvite[]) => void;
}) {
  const [emailRole, setEmailRole] = useState<"viewer" | "editor">("viewer");
  const [email, setEmail] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<SelectedContact[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    const targetEmails = selectedContacts.map(c => c.email);
    const rawEmails = email.split(/[,\s]+/).map(e => e.trim()).filter(Boolean);
    const newlyAdded: SelectedContact[] = [];

    // Add pending inputs if they are valid emails
    for (const trimmed of rawEmails) {
      const isMem = allMembers.some(m => m.user?.email?.toLowerCase() === trimmed.toLowerCase());
      const isInv = invites.some(inv => inv.status === 'pending' && inv.email?.toLowerCase() === trimmed.toLowerCase() && new Date(inv.expires_at) > new Date());
      
      if (isValidEmail(trimmed) && !targetEmails.includes(trimmed) && !isMem && !isInv) {
        targetEmails.push(trimmed);
        newlyAdded.push({ id: crypto.randomUUID(), email: trimmed, name: null, image: null, isCustom: true });
      }
    }
    
    if (newlyAdded.length > 0) {
      // Auto-convert to pills so user sees they were included
      setSelectedContacts([...selectedContacts, ...newlyAdded]);
      setEmail("");
    }
    
    if (targetEmails.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await sendEmailInvites(documentId, targetEmails, emailRole);
      toast.success(`Successfully sent invitations to ${targetEmails.length} user${targetEmails.length > 1 ? 's' : ''}`);
      
      // Instantly block them from being selected again without a page reload
      const newPendingInvites = targetEmails.map(e => ({
        email: e,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Fake expiry for immediate UI update
      }));
      if (onInviteSent) onInviteSent(newPendingInvites);
      
      setSelectedContacts([]);
      setEmail("");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to send invitations";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasValidPendingEmail = email.split(/[,\s]+/).map(e => e.trim()).some(e => {
    if (!isValidEmail(e)) return false;
    const isMem = allMembers.some(m => m.user?.email?.toLowerCase() === e.toLowerCase());
    const isInv = invites.some(inv => inv.status === 'pending' && inv.email?.toLowerCase() === e.toLowerCase() && new Date(inv.expires_at) > new Date());
    return !isMem && !isInv;
  });
  
  const isSubmitDisabled = (selectedContacts.length === 0 && !hasValidPendingEmail) || isSubmitting;

  const sortedMembers = [...allMembers].sort((a, b) => {
    const roleOrder: Record<string, number> = { owner: 0, editor: 1, viewer: 2 };
    return (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3);
  });

  const pendingInvites = invites.filter(inv => inv.status === 'pending' && new Date(inv.expires_at) > new Date());

  return (
    <div className="flex flex-col space-y-4">
      <form onSubmit={handleSendEmail} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Email Address
        </Label>
        <UserSearchInput
          selectedContacts={selectedContacts}
          onContactsChange={setSelectedContacts}
          emailQuery={email}
          onEmailQueryChange={setEmail}
          allMembers={allMembers}
          invites={invites}
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Role
        </Label>
        <div className="flex items-center bg-muted p-1 rounded-full border border-border shadow-sm w-full">
          {[
            { id: 'viewer', label: 'Viewer', icon: Eye },
            { id: 'editor', label: 'Editor', icon: Edit2 },
          ].map(f => {
            const Icon = f.icon;
            return (
              <button
                type="button"
                key={f.id}
                onClick={() => setEmailRole(f.id as "viewer" | "editor")}
                className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-full text-[13.5px] font-medium transition-all duration-200 ${
                  emailRole === f.id 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Icon className="h-[15px] w-[15px]" />
                {f.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="pt-4 mt-2 border-t border-border">
        <div className="flex items-center gap-2 mb-2 px-1">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">People with access</h4>
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-bold text-muted-foreground">
            {sortedMembers.length + pendingInvites.length}
          </span>
        </div>
        <div className="max-h-[180px] overflow-y-auto pr-2 space-y-1 bg-muted/30 p-2 rounded-xl border border-border/50 scrollbar-thin scrollbar-thumb-zinc-200 hover:scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 dark:hover:scrollbar-thumb-zinc-600 scrollbar-track-transparent">
          {sortedMembers.map((member) => {
            const { name, image, email } = extractUserInfo(member.user);
            return (
            <div key={member.user.id} className="flex items-center justify-between p-2 bg-card hover:bg-accent border border-transparent hover:border-border rounded-lg transition-all shadow-sm">
              <div className="flex items-center space-x-3 overflow-hidden">
                <Avatar className="w-8 h-8 border border-border shrink-0">
                  <AvatarImage src={image} />
                  <AvatarFallback className="text-[10px]">{getInitials(name, email)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[13px] font-medium text-foreground truncate leading-snug">{name}</span>
                  <span className="text-[11px] text-muted-foreground truncate leading-snug">{email}</span>
                </div>
              </div>
              <div className={`ml-3 shrink-0 text-[11px] font-medium capitalize px-2 py-0.5 border rounded-md ${
                member.role === 'owner' 
                  ? 'bg-purple-400/15 text-purple-500 border-purple-500/30'
                  : member.role === 'editor'
                  ? 'bg-blue-400/15 text-blue-500 border-blue-500/30'
                  : 'bg-gray-400/15 text-gray-500 border-gray-500/30'
              }`}>
                {member.role}
              </div>
            </div>
          )})}
          {pendingInvites.map((inv, idx) => (
            <div key={inv.id || idx} className="flex items-center justify-between p-2 bg-card hover:bg-accent border border-transparent hover:border-border rounded-lg transition-all shadow-sm">
              <div className="flex items-center space-x-3 overflow-hidden">
                <Avatar className="w-8 h-8 border border-border shrink-0">
                  <AvatarFallback className="bg-muted text-[10px]">{getInitials(null, inv.email)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[13px] font-medium text-foreground truncate leading-snug">{inv.email}</span>
                  <span className="text-[11px] text-muted-foreground truncate leading-snug">Pending Invite</span>
                </div>
              </div>
              <div className="ml-3 shrink-0 text-[11px] font-medium px-2 py-0.5 bg-emerald-300/15 text-emerald-800 border border-emerald-500/30 rounded-md border-dashed">
                Invited
              </div>
            </div>
          ))}
        </div>
      </div>
      <Button
        type="submit"
        disabled={isSubmitDisabled}
        className="relative w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-md rounded-xl h-11 font-medium mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
      >
        <span className={isSubmitting ? "opacity-0 flex items-center justify-center" : "flex items-center justify-center"}>
          <Send className="mr-2 h-4 w-4" />
          Send Invitation
        </span>
        {isSubmitting && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </Button>
      </form>
    </div>
  );
}
