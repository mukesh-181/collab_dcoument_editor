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
        <Select
          value={emailRole}
          onValueChange={(val: "viewer" | "editor") => setEmailRole(val)}
        >
          <SelectTrigger className="w-full h-11 text-[15px] bg-white dark:bg-zinc-950 rounded-lg">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="viewer">
              <div className="flex items-center gap-2.5">
                <Eye className="h-[18px] w-[18px] text-zinc-500" />
                <span className="text-[15px]">Viewer</span>
              </div>
            </SelectItem>
            <SelectItem value="editor">
              <div className="flex items-center gap-2.5">
                <Edit2 className="h-[18px] w-[18px] text-zinc-500" />
                <span className="text-[15px]">Editor</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        disabled={isSubmitDisabled}
        className="relative w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm rounded-lg h-11 font-medium mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
