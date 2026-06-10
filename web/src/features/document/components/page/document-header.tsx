"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Cloud, CloudOff, CloudUpload, Pencil, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useDocumentSync } from "./document-context";
import { updateDocumentTitle } from "@/features/dashboard/actions/update-document-title.action";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ShareDialog } from "@/features/invites/components/share-dialog";
import { ActiveUsersCluster } from "./active-users-cluster";
import { MobileSidebar } from "@/features/dashboard/components/layout/mobile-sidebar";

interface DocumentHeaderProps {
  document: {
    id: string;
    title: string;
    updated_at: string;
    all_members?: {
      role: string;
      user: {
        id: string;
        name: string;
        image: string;
        email: string;
      };
    }[];
  };
  documents?: any[];
  currentUserRole?: string;
}

export function DocumentHeader({
  document,
  documents = [],
  currentUserRole = "viewer",
}: DocumentHeaderProps) {
  const { syncState } = useDocumentSync();
  const [title, setTitle] = useState(document.title);
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [draftTitle, setDraftTitle] = useState(document.title);

  const handleTitleChange = async (formData: FormData) => {
    const newTitle = (formData.get("title") as string) || title;
    if (newTitle.trim() === document.title || newTitle.trim() === "") {
      setOpen(false);
      return;
    }

    setIsPending(true);
    try {
      await updateDocumentTitle(document.id, newTitle);
      setTitle(newTitle);
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update title");
    } finally {
      setIsPending(false);
    }
  };

  // Handle dialog opening to reset the draft title
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setDraftTitle(title);
    }
  };

  const isSaveDisabled =
    isPending || draftTitle.trim() === "" || draftTitle.trim() === title;

  return (
    <div className="flex items-center justify-between h-14 pr-4 pl-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
      <div className="flex items-center gap-2">
        <MobileSidebar documents={documents} />
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Dashboard</span>
          </Link>
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex flex-col ml-1">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate max-w-[200px] sm:max-w-[400px]">
              {title}
            </h1>

            {currentUserRole !== "viewer" && (
              <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    <Pencil className="h-3 w-3" />
                    <span className="sr-only">Rename document</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg">
                  <form action={handleTitleChange}>
                    <div className="bg-zinc-50/50 dark:bg-zinc-900/50 p-6 border-b border-zinc-100 dark:border-zinc-800">
                      <DialogHeader>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <Pencil className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                          </div>
                          <div className="text-left">
                            <DialogTitle className="text-xl font-semibold">Rename Document</DialogTitle>
                            <DialogDescription className="mt-1.5 -ml-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100/50 dark:bg-zinc-800/50 px-2 py-1 rounded-md inline-block">
                              Enter a new name for your document.
                            </DialogDescription>
                          </div>
                        </div>
                      </DialogHeader>
                    </div>
                    
                    <div className="p-6">
                      <div className="space-y-3">
                        <Label htmlFor="title" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          Document Title
                        </Label>
                        <Input
                          id="title"
                          name="title"
                          value={draftTitle}
                          onChange={(e) => setDraftTitle(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="h-11 px-4 text-[15px] rounded-lg border-zinc-200 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:focus-visible:ring-zinc-600 shadow-sm bg-white dark:bg-zinc-950"
                          autoFocus
                          required
                        />
                      </div>
                    </div>
                    
                    <DialogFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2 sm:space-x-0">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        disabled={isPending}
                        className="rounded-lg h-10 px-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Cancel
                      </Button>
                      
                      <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-600 mx-1 hidden sm:block" />
                      
                      <Button 
                        type="submit" 
                        disabled={isSaveDisabled}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm rounded-lg h-10 px-6 font-medium"
                      >
                        {isPending ? "Saving..." : "Save"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            {syncState === "saving" && (
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                <CloudUpload className="h-3 w-3 animate-pulse" />
                <span>Saving...</span>
              </div>
            )}
            {syncState === "saved" && (
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                <Cloud className="h-3 w-3" />
                <span>Saved</span>
              </div>
            )}
            {syncState === "offline" && (
              <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-500">
                <CloudOff className="h-3 w-3" />
                <span>Offline</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* View Only Badge */}
        {currentUserRole === "viewer" && (
          <div className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800 rounded-sm">
            View Only
          </div>
        )}

        {/* Active Users (Live Presence) */}
        <ActiveUsersCluster />

        {/* Member Avatars */}
        {document.all_members && document.all_members.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center -space-x-2 mr-2 focus:outline-none cursor-pointer group">
                {document.all_members.map((member) => (
                  <Avatar
                    key={member.user.id}
                    className="w-8 h-8 border-2 border-white dark:border-zinc-950 transition-transform group-hover:scale-105"
                  >
                    <AvatarImage
                      src={member.user.image || ""}
                      alt={member.user.name || "User"}
                    />
                    <AvatarFallback className="text-[10px]">
                      {(member.user.name || member.user.email || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              className="w-80 p-0 shadow-lg rounded-xl overflow-hidden border-zinc-200 dark:border-zinc-800"
            >
              <div className="bg-zinc-50/80 dark:bg-zinc-900/50 p-4 border-b border-zinc-100 dark:border-zinc-800 backdrop-blur-sm flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm shrink-0">
                  <Users className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
                    Document Members
                  </h3>
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {document.all_members.length} people have access
                  </p>
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin">
                {document.all_members.map((member) => (
                  <div
                    key={member.user.id}
                    className="flex items-center justify-between p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <Avatar className="w-9 h-9 border border-zinc-200 dark:border-zinc-800 shrink-0 shadow-sm">
                        <AvatarImage
                          src={member.user.image || ""}
                          alt={member.user.name || "User"}
                        />
                        <AvatarFallback>
                          {(member.user.name || member.user.email || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[14px] font-medium text-zinc-900 dark:text-zinc-50 truncate leading-snug">
                          {member.user.name || "Anonymous User"}
                        </span>
                        <span className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate leading-snug">
                          {member.user.email}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3 shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-default select-none">
                      {member.role === "editor" || member.role === "owner" ? (
                        <Pencil className="h-3 w-3 text-zinc-500" />
                      ) : (
                        <Eye className="h-3 w-3 text-zinc-500" />
                      )}
                      <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 capitalize">
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Invite Button */}
        {currentUserRole !== "viewer" && (
          <ShareDialog documentId={document.id} />
        )}
      </div>
    </div>
  );
}
