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
import { useEffect, useState, useRef, useMemo } from "react";
import { OfflineBanner } from "./offline-banner";
import { EditorSkeleton } from "@/features/document/components/page/document-skeleton";

interface EditorProps {
  documentId: string;
  documentTitle?: string;
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
    
    // Force pagination recalculation after web fonts have fully loaded
    if (editor && typeof window !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        setTimeout(() => {
          if (!editor.isDestroyed) {
            // Firing a resize event forces most DOM-measuring plugins (like pagination) to recalculate
            window.dispatchEvent(new Event("resize"));
            
            // Also force a proseMirror view update just in case
            editor.view.dispatch(editor.state.tr.setMeta("forceUpdate", true));
          }
        }, 200);
      });
    }
    
    return () => window.removeEventListener("focus-editor", handleFocus);
  }, [editor]);
  return null;
}

function EditorRoleSync({ role }: { role: string }) {
  const { editor } = useCurrentEditor();
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(role !== "viewer");
    }
  }, [editor, role]);
  return null;
}

export function Editor({
  documentId,
  documentTitle = "Untitled Document",
  currentUserName,
  token,
}: EditorProps) {
  const { setSyncState, setActiveUsers, setIsEditorReady, currentUserRole } = useDocumentSync();
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
        // Add a slight delay to allow Tiptap and PaginationPlus to finish rendering
        // their complex DOM layout before we remove the skeleton overlay.
        setTimeout(() => {
          setIsEditorReady(true);
        }, 150);
      },
      onAwarenessUpdate: ({ states }) => {
        const users: any[] = [];
        states.forEach((state: any) => {
          if (state.user && state.clientId !== doc.clientID) {
            users.push({ clientId: state.clientId, user: state.user });
          }
        });
        
        setActiveUsers((prev) => {
          const prevString = JSON.stringify(prev);
          const newString = JSON.stringify(users);
          return prevString === newString ? prev : users;
        });
      },
    });

    setProvider(hocuspocusProvider);

    return () => {
      hocuspocusProvider.destroy();
      doc.destroy();
    };
  }, [documentId, token, setSyncState, setIsEditorReady]);

  const editorProps = useMemo(() => editorPropsConfig, []);

  const extensions = useMemo(
    () => {
      if (!provider || !ydoc) return [];
      return getEditorExtensions({ documentId, ydoc, provider, currentUserName });
    },
    [documentId, ydoc, provider, currentUserName]
  );

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
          <div className={`sticky top-14 z-40 w-full flex justify-center pt-4 pb-4 mb-4 bg-zinc-50 dark:bg-zinc-900 pointer-events-none ${currentUserRole === "viewer" ? "hidden" : ""}`}>
            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-md px-1 py-0.5 flex items-center justify-center pointer-events-auto max-w-[95%] overflow-hidden">
              <Toolbar documentId={documentId} />
            </div>
          </div>
        }
        extensions={extensions}
        editorProps={editorProps}
        immediatelyRender={false}
      >
        <LinkBubbleMenu />
        <FormattingBubbleMenu />
        <EditorFocusListener />
        <EditorRoleSync role={currentUserRole} />
      </EditorProvider>
    </div>
  );
}
