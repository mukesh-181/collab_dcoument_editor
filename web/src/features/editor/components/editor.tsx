"use client";
import {
  getEditorExtensions,
  editorPropsConfig,
} from "../config/editor-extensions";

import { ENV } from "@/constants/env";
import { EditorProvider, useCurrentEditor } from "@tiptap/react";

import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { Toolbar } from "./toolbar";
import { LinkBubbleMenu } from "./link-bubble-menu";
import { FormattingBubbleMenu } from "./formatting-bubble-menu";
import {
  useDocumentSync,
  type ActiveUser,
} from "@/features/document/components/page/document-context";
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
  const { setSyncState, setActiveUsers, setIsEditorReady, currentUserRole } =
    useDocumentSync();
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
        states.forEach(
          (state: {
            user?: { name: string; color: string; image?: string };
            clientId?: number;
          }) => {
            if (state.user && state.clientId !== doc.clientID) {
              users.push({
                clientId: state.clientId as number,
                user: state.user,
              });
            }
          },
        );

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
  }, [
    documentId,
    token,
    setSyncState,
    setIsEditorReady,
    setActiveUsers,
    initialYdocState,
  ]);

  const editorProps = useMemo(() => editorPropsConfig, []);

  const extensions = useMemo(() => {
    if (!provider || !ydoc) return [];
    return getEditorExtensions({
      documentId,
      ydoc,
      provider,
      currentUserName,
      currentUserImage,
    });
  }, [documentId, ydoc, provider, currentUserName, currentUserImage]);

  useEffect(() => {
    if (
      provider &&
      ydoc &&
      (isSynced || isOffline || initialYdocState) &&
      !fadeIn
    ) {
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
      <style>{`
        /* Safely fix tiptap-table-plus gap and restore column resizing using CSS Grid */
        .prose.rm-with-pagination table.table-plus,
        .prose.rm-with-pagination table,
        .prose .table-plus,
        .rm-with-pagination table.table-plus,
        .rm-with-pagination table {
          display: contents !important;
        }

        /* Flatten all intermediate wrappers (thead, tbody, row groups) to eliminate gaps.
           display:contents makes these elements invisible in layout — their tr children
           flow as direct siblings, preventing any gap between header and body rows. */
        .prose.rm-with-pagination table.table-plus thead,
        .prose.rm-with-pagination table.table-plus tbody,
        .prose .table-plus thead,
        .prose .table-plus tbody,
        .rm-with-pagination table.table-plus thead,
        .rm-with-pagination table.table-plus tbody,
        .rm-with-pagination table thead,
        .rm-with-pagination table tbody,
        .table-row-group > tbody,
        .prose.rm-with-pagination .table-row-group,
        .prose .table-row-group,
        .rm-with-pagination .table-row-group,
        .table-row-group {
          display: contents !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
        }

        /* Force rows to be CSS Grid to enable grid-template-columns column resizing */
        .prose.rm-with-pagination table.table-plus tr,
        .prose.rm-with-pagination table.table-plus tbody > tr,
        .prose .table-plus tr,
        .rm-with-pagination table.table-plus tr,
        .rm-with-pagination table tbody > tr,
        .rm-with-pagination table tr,
        .rm-with-pagination table > tr,
        .rm-with-pagination table thead > tr {
          display: grid !important;
          grid-template-columns: var(--cell-percentage) !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          border-bottom: none !important;
          gap: 0 !important;
          line-height: inherit !important;
        }

        /* Ensure the TablePlusNodeView wrapper div has no internal gaps */
        .prose div:has(> .table-plus) {
          display: flex !important;
          flex-direction: column !important;
          gap: 0 !important;
          border-spacing: 0 !important;
        }

        /* Simulated border collapse for CSS Grid tables to ensure perfect 1px borders without gaps */
        .prose.rm-with-pagination table.table-plus td,
        .prose.rm-with-pagination table.table-plus th,
        .prose .table-plus td,
        .prose .table-plus th,
        .rm-with-pagination table.table-plus td,
        .rm-with-pagination table.table-plus th {
          border: none !important;
          border-right: 1px solid #a1a1aa !important;
          border-bottom: 1px solid #a1a1aa !important;
          padding: 8px !important;
          margin: 0 !important; /* Prevent margins on grid items */
          vertical-align: top !important;
          box-sizing: border-box !important;
        }

        .dark .prose.rm-with-pagination table.table-plus td,
        .dark .prose.rm-with-pagination table.table-plus th,
        .dark .prose .table-plus td,
        .dark .prose .table-plus th,
        .dark .rm-with-pagination table.table-plus td,
        .dark .rm-with-pagination table.table-plus th {
          border: none !important;
          border-right: 1px solid #52525b !important;
          border-bottom: 1px solid #52525b !important;
        }

        /* Add left border to the first cell of every row */
        .prose.rm-with-pagination table.table-plus tr > *:first-child,
        .prose .table-plus tr > *:first-child,
        .rm-with-pagination table.table-plus tr > *:first-child {
          border-left: 1px solid #a1a1aa !important;
        }

        .dark .prose.rm-with-pagination table.table-plus tr > *:first-child,
        .dark .prose .table-plus tr > *:first-child,
        .dark .rm-with-pagination table.table-plus tr > *:first-child {
          border-left: 1px solid #52525b !important;
        }

        /* Add top border only to all cells in the first row of the table (header row, or first body row only if no thead) */
        .prose.rm-with-pagination table.table-plus thead tr:first-child > *,
        .prose .table-plus thead tr:first-child > *,
        .rm-with-pagination table.table-plus thead tr:first-child > *,
        .prose.rm-with-pagination table.table-plus:not(:has(thead)) tbody tr:first-child > *,
        .prose .table-plus:not(:has(thead)) tbody tr:first-child > *,
        .rm-with-pagination table.table-plus:not(:has(thead)) tbody tr:first-child > * {
          border-top: 1px solid #a1a1aa !important;
        }

        .dark .prose.rm-with-pagination table.table-plus thead tr:first-child > *,
        .dark .prose .table-plus thead tr:first-child > *,
        .dark .rm-with-pagination table.table-plus thead tr:first-child > *,
        .dark .prose.rm-with-pagination table.table-plus:not(:has(thead)) tbody tr:first-child > *,
        .dark .prose .table-plus:not(:has(thead)) tbody tr:first-child > *,
        .dark .rm-with-pagination table.table-plus:not(:has(thead)) tbody tr:first-child > * {
          border-top: 1px solid #52525b !important;
        }

        /* Fix tiptap-table-plus slider to be overlayed on top of the table */
        .prose div:has(> .table-plus) > div[contenteditable="false"] {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 0 !important;
          z-index: 100 !important;
          pointer-events: none !important;
          overflow: visible !important;
        }

        /* Transform the black dots into full-height vertical draggable borders */
        .prose .handle {
          width: 8px !important;
          height: 2000px !important;
          background-color: transparent !important;
          border-radius: 0 !important;
          transform: translate(-50%, 0) !important;
          top: 0 !important;
          cursor: col-resize !important;
          pointer-events: auto !important;
          z-index: 101 !important;
          transition: background-color 0.15s ease;
        }

        .prose .handle:hover,
        .prose .handle:active {
          background-color: rgba(99, 102, 241, 0.4) !important;
        }
      `}</style>
      <OfflineBanner />
      <EditorProvider
        editable={currentUserRole !== "viewer"}
        slotBefore={
          <div
            className={`sticky top-14 z-40 w-full flex justify-center pt-4 pb-4 mb-4 bg-zinc-50 dark:bg-zinc-900 pointer-events-none ${currentUserRole === "viewer" ? "hidden" : ""}`}
          >
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
