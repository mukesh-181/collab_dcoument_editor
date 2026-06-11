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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SendEmailTab() {
  const [emailRole, setEmailRole] = useState<"viewer" | "editor">("viewer");
  const [email, setEmail] = useState("");

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    // Email sending will be handled later
    console.log("Sending email to:", email, "with role:", emailRole);
  };

  return (
    <form onSubmit={handleSendEmail} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="colleague@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 px-4 text-[15px] rounded-lg border-zinc-200 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:focus-visible:ring-zinc-600 shadow-sm bg-white dark:bg-zinc-950"
          required
        />
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
        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm rounded-lg h-11 font-medium mt-2"
      >
        <Send className="mr-2 h-4 w-4" />
        Send Invitation
      </Button>
    </form>
  );
}
