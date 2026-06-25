"use client";
import { getEditorExtensions, editorPropsConfig } from "../config/editor-extensions";

import { ENV } from "@/constants/env";
import { EditorProvider, useCurrentEditor } from "@tiptap/react";

import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { Toolbar } from "./toolbar";
import { LinkBubbleMenu } from "./link-bubble-menu";
import { FormattingBubbleMenu } from "./formatting-bubble-menu";
import { useDocumentSync, type ActiveUser } from "@/features/document/components/page/document-context";
import { useEffect, useState, useMemo } from "react";
import { OfflineBanner } from "./offline-banner";

interface EditorProps {
  documentId: string;
  currentUserName: string;
  currentUserImage?: string;
  token: string;
  initialYdocState?: string;
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
  currentUserName,
  currentUserImage,
  token,
  initialYdocState,
}: EditorProps) {
  const { setSyncState, setActiveUsers, setIsEditorReady, currentUserRole } = useDocumentSync();
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (!token) return;

    const doc = new Y.Doc();
    
    if (initialYdocState) {
      try {
        const binaryString = atob(initialYdocState);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        Y.applyUpdate(doc, bytes);
        setIsEditorReady(true);
      } catch (e) {
        console.error("Failed to parse initial ydoc state", e);
      }
    }

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
        setTimeout(() => {
          setIsEditorReady(true);
        }, 150);
      },
      onAwarenessUpdate: ({ states }) => {
        const users: ActiveUser[] = [];
        states.forEach((state: { user?: { name: string; color: string; image?: string }; clientId?: number }) => {
          if (state.user && state.clientId !== doc.clientID) {
            users.push({ clientId: state.clientId as number, user: state.user });
          }
        });

        setActiveUsers((prev) => {
          const prevString = JSON.stringify(prev);
          const newString = JSON.stringify(users);
          return prevString === newString ? prev : users;
        });
      },
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProvider(hocuspocusProvider);
    setYdoc(doc);

    return () => {
      hocuspocusProvider.destroy();
      doc.destroy();
    };
  }, [documentId, token, setSyncState, setIsEditorReady, setActiveUsers, initialYdocState]);

  const editorProps = useMemo(() => editorPropsConfig, []);

  const extensions = useMemo(
    () => {
      if (!provider || !ydoc) return [];
      return getEditorExtensions({ documentId, ydoc, provider, currentUserName, currentUserImage });
    },
    [documentId, ydoc, provider, currentUserName, currentUserImage]
  );

  useEffect(() => {
    if (provider && ydoc && (isSynced || isOffline || initialYdocState) && !fadeIn) {
      const id = requestAnimationFrame(() => setFadeIn(true));
      return () => cancelAnimationFrame(id);
    }
  }, [provider, ydoc, isSynced, isOffline, fadeIn, initialYdocState]);

  if (!provider || !ydoc || (!isSynced && !isOffline && !initialYdocState)) {
    return null;
  }

  return (
    <div
      className="flex flex-col w-full min-h-full transition-opacity duration-500 ease-in-out"
      style={{ opacity: fadeIn ? 1 : 0 }}
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
            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-2 border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-md px-1 py-0.5 flex items-center justify-center pointer-events-auto max-w-[95%] overflow-hidden">
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
