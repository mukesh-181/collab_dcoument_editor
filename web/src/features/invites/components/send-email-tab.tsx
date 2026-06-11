"use client";

import { useState } from "react";
import { Send, Eye, Edit2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserSearchInput, SelectedContact } from "./user-search-input";

export function SendEmailTab() {
  const [emailRole, setEmailRole] = useState<"viewer" | "editor">("viewer");
  const [email, setEmail] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<SelectedContact[]>([]);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    
    const targetEmails = selectedContacts.map(c => c.email);
    const trimmedEmail = email.trim();
    
    // Add pending input if it's a valid email
    if (trimmedEmail && isValidEmail(trimmedEmail) && !targetEmails.includes(trimmedEmail)) {
      targetEmails.push(trimmedEmail);
      // Auto-convert to pill so user sees it was included
      setSelectedContacts([...selectedContacts, { id: crypto.randomUUID(), email: trimmedEmail, name: null, image: null, isCustom: true }]);
      setEmail("");
    }
    
    if (targetEmails.length === 0) return;
    
    // Email sending will be handled later
    console.log("Sending emails to:", targetEmails, "with role:", emailRole);
  };

  const isSubmitDisabled = selectedContacts.length === 0 && !isValidEmail(email);

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
        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm rounded-lg h-11 font-medium mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="mr-2 h-4 w-4" />
        Send Invitation
      </Button>
    </form>
  );
}
