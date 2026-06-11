"use client";

import { useState } from "react";
import { Share2, Link as LinkIcon, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentSync } from "@/features/document/components/page/document-context";
import { CreateLinkTab } from "./create-link-tab";
import { SendEmailTab } from "./send-email-tab";

export function ShareDialog({ documentId }: { documentId: string }) {
  const { syncState } = useDocumentSync();
  const [isOpen, setIsOpen] = useState(false);

  const isSavePending = syncState !== "saved";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              <CreateLinkTab documentId={documentId} />
            </TabsContent>

            <TabsContent value="email" className="outline-none">
              <SendEmailTab />
            </TabsContent>
          </Tabs>
        </div>

      </DialogContent>
    </Dialog>
  );
}
