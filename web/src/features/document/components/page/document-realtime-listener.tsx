"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldAlert, UserMinus } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useDocumentSync } from "./document-context";
import { toast } from "sonner";

interface DocumentRealtimeListenerProps {
  documentId: string;
}

export function DocumentRealtimeListener({
  documentId,
}: DocumentRealtimeListenerProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { setCurrentUserRole } = useDocumentSync();

  const [removedDialogOpen, setRemovedDialogOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel>;

    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!isMounted || !user?.email) return;

      const channelName = `doc-listener-${documentId}-${crypto.randomUUID()}`;

      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "invites",
            filter: `email=eq.${user.email}`,
          },
          (payload) => {
            const invite = payload.new as any;
            if (invite.document_id !== documentId) return;

            if (invite.status === "removed") {
              setRemovedDialogOpen(true);
            } else if (invite.status === "role_updated") {
              setCurrentUserRole(invite.role);
              toast.success(`Your role was updated to ${invite.role}. ${invite.role === 'editor' ? 'You can now edit the document.' : 'You can no longer edit the document.'}`);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "document_members",
            filter: `document_id=eq.${documentId}`,
          },
          () => {
            // When anyone is added, removed, or has their role changed, refresh the server state
            // to instantly update the DocumentMembersPopover for everyone viewing the document.
            router.refresh();
          }
        );

      channel.subscribe();
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, documentId]);

  return (
    <>
      <AlertDialog open={removedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-red-500" />
              Access Revoked
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your access to this document has been removed by the owner. You can no
              longer view or edit this document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => router.push(ROUTES.DASHBOARD)} className="relative bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-md rounded-xl font-medium transition-all hover:-translate-y-0.5">
              Return to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
