"use client";

import { useState } from "react";
import { Copy, Check, Loader2, AlertCircle, Eye, Edit2 } from "lucide-react";
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
import { createInviteLink } from "../actions/create-invite.action";
import { ROUTES } from "@/constants/routes";

interface CreateLinkTabProps {
  documentId: string;
}

export function CreateLinkTab({ documentId }: CreateLinkTabProps) {
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [inviteLink, setInviteLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState("");

  const handleCreateLink = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = await createInviteLink(documentId, role);
      const url = new URL(
        ROUTES.INVITE(token),
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
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium p-3 rounded-md mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {!inviteLink ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Collaborator Role
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
                    onClick={() => setRole(f.id as "viewer" | "editor")}
                    className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-full text-[13.5px] font-medium transition-all duration-200 ${
                      role === f.id 
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
            onClick={handleCreateLink}
            disabled={isLoading}
            className="relative w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-md rounded-xl h-11 font-medium mt-2 transition-all hover:-translate-y-0.5"
          >
            <span className={isLoading ? "opacity-0" : ""}>Generate Link</span>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
          </Button>
        </div>
      ) : (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col gap-3">
          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            One-time link generated successfully
          </div>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={inviteLink}
              className="flex-1 bg-white dark:bg-zinc-950 font-mono text-xs h-10"
            />
            <Button
              size="icon"
              variant="secondary"
              onClick={handleCopy}
              className="shrink-0 h-10 w-10"
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
    </>
  );
}
