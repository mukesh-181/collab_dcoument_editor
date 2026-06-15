"use client";

import { useState } from "react";
import { Send, Eye, Edit2, Loader2 } from "lucide-react";
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

export function SendEmailTab({ documentId }: { documentId: string }) {
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
      if (isValidEmail(trimmed) && !targetEmails.includes(trimmed)) {
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
      setSelectedContacts([]);
      setEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitations");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasValidPendingEmail = email.split(/[,\s]+/).map(e => e.trim()).some(isValidEmail);
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
        />
        <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
          Create link if email is not registered with us.
        </p>
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
