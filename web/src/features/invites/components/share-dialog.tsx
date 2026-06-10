"use client";

import { useState } from "react";
import { Share2, Copy, Check, Loader2, AlertCircle, Link as LinkIcon, Mail, Send, Eye, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentSync } from "@/features/document/components/page/document-context";
import { createInviteLink } from "../actions/create-invite.action";

export function ShareDialog({ documentId }: { documentId: string }) {
  const { syncState } = useDocumentSync();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [emailRole, setEmailRole] = useState<"viewer" | "editor">("viewer");
  const [email, setEmail] = useState("");
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

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    // Email sending will be handled later
    console.log("Sending email to:", email, "with role:", emailRole);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
        setIsOpen(false);
      }, 1000);
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
        setEmailRole("viewer");
        setEmail("");
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
      
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg">
        <div className="bg-zinc-50/50 dark:bg-zinc-900/50 p-6 border-b border-zinc-100 dark:border-zinc-800">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <Share2 className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-xl font-semibold">Share Document</DialogTitle>
                <DialogDescription className="mt-1.5 -ml-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100/50 dark:bg-zinc-800/50 px-2 py-1 rounded-md inline-block">
                  Add collaborators to your document.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6">
          <Tabs defaultValue="link" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="link" className="text-[13px]">
                <LinkIcon className="h-3.5 w-3.5 mr-2" />
                Create Link
              </TabsTrigger>
              <TabsTrigger value="email" className="text-[13px]">
                <Mail className="h-3.5 w-3.5 mr-2" />
                Send via Email
              </TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="outline-none">
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
                    <Select
                      value={role}
                      onValueChange={(val: "viewer" | "editor") => setRole(val)}
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
                    onClick={handleCreateLink}
                    disabled={isLoading}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm rounded-lg h-11 font-medium mt-2"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Link
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
            </TabsContent>

            <TabsContent value="email" className="outline-none">
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
            </TabsContent>
          </Tabs>
        </div>

      </DialogContent>
    </Dialog>
  );
}
