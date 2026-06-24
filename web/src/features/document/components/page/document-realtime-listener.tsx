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
import { UserMinus } from "lucide-react";
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
            event: "*",
            schema: "public",
            table: "invites",
          },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const record = payload.new as Record<string, unknown>;
              
              if (record.document_id !== documentId) return;

              if (record.email === user.email) {
                if (record.status === "removed") {
                  setRemovedDialogOpen(true);
                  return;
                } else if (record.status === "role_updated") {
                  setCurrentUserRole(record.role as string);
                  toast.success(`Your role was updated to ${record.role as string}. ${(record.role as string) === 'editor' ? 'You can now edit the document.' : 'You can no longer edit the document.'}`);
                }
              }
              
              router.refresh();
            } else if (payload.eventType === 'DELETE') {
              router.refresh();
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "document_members",
          },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              const oldRecord = payload.old as Record<string, unknown>;
              // If PK is just 'id', oldRecord won't have user_id to check. 
              // We just refresh the page.
              router.refresh();
            } else {
              const record = payload.new as Record<string, unknown>;
              if (record.document_id === documentId) {
                router.refresh();
              }
            }
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
  }, [supabase, documentId, router, setCurrentUserRole]);

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
