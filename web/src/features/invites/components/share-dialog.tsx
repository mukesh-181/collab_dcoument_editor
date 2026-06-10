"use client";

import { useState } from "react";
import { Share2, Copy, Check, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentSync } from "@/features/document/components/page/document-context";
import { createInviteLink } from "../actions/create-invite.action";

export function ShareDialog({ documentId }: { documentId: string }) {
  const { syncState } = useDocumentSync();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [inviteLink, setInviteLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState("");

  const isSavePending = syncState !== "saved";

  const handleCreateLink = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = await createInviteLink(documentId, role);
      const url = new URL(
        `/dashboard/invite?token=${token}`,
        window.location.origin,
      );
      setInviteLink(url.toString());
    } catch (err: any) {
      setError(err.message || "Failed to create invite link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const resetState = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setInviteLink("");
        setError("");
        setRole("viewer");
      }, 300); // reset after animation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetState}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isSavePending}
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Create a one-time invite link to add a collaborator.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium p-3 rounded-md mt-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {!inviteLink ? (
          <div className="flex items-center gap-2 mt-4">
            <Select
              value={role}
              onValueChange={(val: "viewer" | "editor") => setRole(val)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleCreateLink}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Link
            </Button>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col gap-3">
            <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              One-time link generated successfully
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={inviteLink}
                className="flex-1 bg-white dark:bg-zinc-950 font-mono text-xs"
              />
              <Button
                size="icon"
                variant="secondary"
                onClick={handleCopy}
                className="shrink-0"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
