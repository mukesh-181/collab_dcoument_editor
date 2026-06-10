"use client";

import { ENV } from "@/lib/constants/env";
import { EditorProvider } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { FontSize } from "../extensions/font-size";
import { Toolbar } from "./toolbar";
import { LinkBubbleMenu } from "./link-bubble-menu";
import { useDocumentSync } from "@/features/document/components/page/document-context";
import { useEffect, useState, useRef } from "react";
import { OfflineBanner } from "./offline-banner";

interface EditorProps {
  documentId: string;
  currentUserRole?: string;
  currentUserName: string;
  token: string;
}

const CustomLink = Link.extend({
  renderHTML({ HTMLAttributes }) {
    const { href, ...rest } = HTMLAttributes;
    return ["a", { ...rest, "data-href": href, style: "cursor: text" }, 0];
  },
});

export function Editor({
  documentId,
  currentUserRole = "viewer",
  currentUserName,
  token,
}: EditorProps) {
  const { setSyncState, setActiveUsers } = useDocumentSync();
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);

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
        if (status === "connected") setSyncState("saved");
        else if (status === "connecting") setSyncState("saving");
        else setSyncState("offline");
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
  }, [documentId, token, setSyncState]);

  if (!provider || !ydoc) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[1056px]">
        <p className="text-zinc-500">Connecting to document server...</p>
      </div>
    );
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
              <div className="w-full max-w-[816px]">
                <Toolbar />
              </div>
            </div>
          )
        }
        extensions={[
          StarterKit.configure({
            code: false,
            codeBlock: false,
            horizontalRule: false,
            blockquote: false,
            bulletList: false,
            orderedList: false,
            // Disable history because Collaboration extension handles it natively via Yjs
            history: false,
          }),
          TextStyle,
          Color,
          Underline,
          Highlight,
          Image,
          FontSize,
          Collaboration.configure({
            document: ydoc,
          }),
          CollaborationCursor.configure({
            provider: provider,
            user: {
              name: currentUserName,
              color: [
                "#f43f5e",
                "#8b5cf6",
                "#0ea5e9",
                "#10b981",
                "#f59e0b",
                "#d946ef",
                "#06b6d4",
                "#f97316",
              ][Math.floor(Math.random() * 8)],
            },
          }),
          CustomLink.configure({
            openOnClick: false,
            autolink: true,
            defaultProtocol: "https",
          }),
          TextAlign.configure({
            types: ["heading", "paragraph"],
          }),
          Placeholder.configure({
            placeholder: "Start typing here...",
            emptyEditorClass: "is-editor-empty",
          }),
        ]}
        editorProps={{
          attributes: {
            class:
              "editor-page-bg prose prose-zinc dark:prose-invert max-w-[816px] w-full min-h-[1056px] mx-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-md px-4 sm:px-16 py-8 sm:py-20 my-4 sm:my-8 focus:outline-none prose-p:m-0 prose-p:leading-[1.2] prose-headings:m-0 prose-headings:mb-2 prose-headings:leading-tight prose-ul:m-0 prose-ol:m-0 prose-li:m-0 leading-[1.2] prose-a:text-blue-600 prose-a:underline dark:prose-a:text-blue-400 cursor-text [&_strong]:text-inherit",
          },
          handleClick: (view, pos, event) => {
            const target = event.target as HTMLElement;
            if (target && target.closest("a")) {
              event.preventDefault();
              return false;
            }
            return false;
          },
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
        {currentUserRole !== "viewer" && <LinkBubbleMenu />}
      </EditorProvider>
    </div>
  );
}
