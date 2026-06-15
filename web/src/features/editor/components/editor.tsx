"use client";
import { getEditorExtensions, editorPropsConfig } from "@/utils/editor-config";

import { ENV } from "@/constants/env";
import { EditorProvider, useCurrentEditor } from "@tiptap/react";

import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { Toolbar } from "./toolbar";
import { LinkBubbleMenu } from "./link-bubble-menu";
import { FormattingBubbleMenu } from "./formatting-bubble-menu";
import { useDocumentSync } from "@/features/document/components/page/document-context";
import { useEffect, useState, useRef } from "react";
import { OfflineBanner } from "./offline-banner";
import { EditorSkeleton } from "@/features/document/components/page/document-skeleton";

interface EditorProps {
  documentId: string;
  documentTitle?: string;
  currentUserRole?: string;
  currentUserName: string;
  token: string;
}

function EditorFocusListener() {
  const { editor } = useCurrentEditor();
  useEffect(() => {
    const handleFocus = () => {
      editor?.commands.focus();
    };
    window.addEventListener("focus-editor", handleFocus);
    return () => window.removeEventListener("focus-editor", handleFocus);
  }, [editor]);
  return null;
}

export function Editor({
  documentId,
  documentTitle = "Untitled Document",
  currentUserRole = "viewer",
  currentUserName,
  token,
}: EditorProps) {
  const { setSyncState, setActiveUsers, setIsEditorReady } = useDocumentSync();
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Only connect to WebSocket if we have a valid token
    if (!token) return;

    const doc = new Y.Doc();
    setYdoc(doc);

    const wsUrl = ENV.WEBSOCKET_URL;

    const hocuspocusProvider = new HocuspocusProvider({
      url: wsUrl,
      name: documentId,
      document: doc,
      token,
      onStatus: ({ status }) => {
        if (status === "connected") {
          setSyncState("saved");
          setIsOffline(false);
        } else if (status === "connecting") {
          setSyncState("saving");
        } else {
          setSyncState("offline");
          setIsOffline(true);
          setIsEditorReady(true);
        }
      },
      onSynced: () => {
        setIsSynced(true);
        setIsEditorReady(true);
      },
      onAwarenessUpdate: ({ states }) => {
        const users: any[] = [];
        states.forEach((state: any) => {
          if (state.user && state.clientId !== doc.clientID) {
            users.push({ clientId: state.clientId, user: state.user });
          }
        });
        setActiveUsers(users);
      },
    });

    setProvider(hocuspocusProvider);

    return () => {
      hocuspocusProvider.destroy();
      doc.destroy();
    };
  }, [documentId, token, setSyncState, setIsEditorReady]);

  // The parent DocumentClientLayout handles the full page skeleton overlay.
  // We just return null until we are ready to mount the actual editor.
  if (!provider || !ydoc || (!isSynced && !isOffline)) {
    return null;
  }

  return (
    <div
      className="flex flex-col w-full min-h-full"
      onClickCapture={(e) => {
        const target = e.target as HTMLElement;
        if (target && target.closest("a")) {
          e.preventDefault();
        }
      }}
    >
      <OfflineBanner />
      <EditorProvider
        editable={currentUserRole !== "viewer"}
        slotBefore={
          currentUserRole !== "viewer" && (
            <div className="sticky top-0 z-10 w-full bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-2 flex justify-center shadow-sm">
              <div className="w-full max-w-full px-4">
                <Toolbar documentId={documentId} />
              </div>
            </div>
          )
        }
                extensions={getEditorExtensions({ documentId, ydoc, provider, currentUserName })}
        editorProps={{
          ...editorPropsConfig,
        }}
        immediatelyRender={false}
        onUpdate={({ editor }) => {
          if (editor.isActive("link")) {
            const { empty, $from } = editor.state.selection;
            if (empty) {
              const isLinkBefore = $from.nodeBefore?.marks.some(
                (mark: any) => mark.type.name === "link",
              );
              const isLinkAfter = $from.nodeAfter?.marks.some(
                (mark: any) => mark.type.name === "link",
              );
              if (!isLinkBefore && !isLinkAfter) {
                editor.commands.unsetLink();
              }
            }
          }
        }}
        onSelectionUpdate={({ editor }) => {
          if (editor.isActive("link")) {
            const { empty, $from } = editor.state.selection;
            if (empty) {
              const isLinkBefore = $from.nodeBefore?.marks.some(
                (mark: any) => mark.type.name === "link",
              );
              const isLinkAfter = $from.nodeAfter?.marks.some(
                (mark: any) => mark.type.name === "link",
              );
              if (!isLinkBefore && !isLinkAfter) {
                editor.commands.unsetLink();
              }
            }
          }
        }}
      >
        {currentUserRole !== "viewer" && (
          <>
            <LinkBubbleMenu />
            <FormattingBubbleMenu />
          </>
        )}
        <EditorFocusListener />
      </EditorProvider>
    </div>
  );
}
