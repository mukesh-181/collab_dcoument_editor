"use client";

import { useState } from "react";
import { Copy, Check, Loader2, AlertCircle, Eye, Edit2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInviteLink } from "../actions/create-invite.action";
import { ROUTES } from "@/constants/routes";
import { ENV } from "@/constants/env";

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
      const appUrl = ENV.NEXT_PUBLIC_APP_URL.endsWith('/') ? ENV.NEXT_PUBLIC_APP_URL.slice(0, -1) : ENV.NEXT_PUBLIC_APP_URL;
      const inviteLinkUrl = `${appUrl}${ROUTES.INVITE(token)}`;
      setInviteLink(inviteLinkUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create invite link";
      setError(msg);
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
                    onClick={() => setRole(f.id as "viewer" | "editor")}
                    className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-full text-[13.5px] font-medium transition-all duration-200 ${
                      role === f.id 
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

          <div className="bg-muted border border-border p-3 rounded-lg flex items-start gap-2.5">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[12.5px] text-muted-foreground leading-relaxed">
              <strong>Note:</strong> This link is multi-use but will <strong>expire in 24 hours</strong>. If an existing member uses this link, it will redirect them straight to the document without overriding their current role.
            </p>
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
        <div className="p-4 bg-muted border border-border rounded-lg flex flex-col gap-3">
          <div className="text-sm font-medium text-foreground">
            One-time link generated successfully
          </div>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={inviteLink}
              className="flex-1 bg-background font-mono text-xs h-10 border-border"
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
