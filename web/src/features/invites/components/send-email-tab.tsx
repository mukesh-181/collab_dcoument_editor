"use client";

import { useState, useEffect } from "react";
import { Send, Eye, Edit2, Loader2, Info, Lightbulb } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserSearchInput, SelectedContact } from "./user-search-input";
import { sendEmailInvites } from "../actions/send-email-invites.action";

export function SendEmailTab({ 
  documentId,
  allMembers = [],
  invites = [],
  onInviteSent
}: { 
  documentId: string;
  allMembers?: any[];
  invites?: any[];
  onInviteSent?: (newInvites: any[]) => void;
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
    let newlyAdded: SelectedContact[] = [];

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
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitations");
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

  return (
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
        <div className="flex items-center gap-1.5 mt-3 px-2.5 py-2 rounded-md bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/50 w-fit">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <p className="text-[12px] text-zinc-600 dark:text-zinc-300 font-medium leading-none">
            Don't know their email? Use the <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Create Link</span> tab above.
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Role
        </Label>
        <div className="flex items-center bg-white/80 dark:bg-zinc-900/50 p-1 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm backdrop-blur-md w-full">
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
                    ? "bg-primary/10 dark:bg-primary/20 text-primary shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <Icon className="h-[15px] w-[15px]" />
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 p-3 rounded-lg flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
        <p className="text-[12.5px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
          <strong>Note:</strong> Existing members and users with pending invites are automatically excluded to prevent duplicates.
        </p>
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
  );
}
