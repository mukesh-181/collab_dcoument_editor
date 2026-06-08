"use client";

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
import { FontSize } from "../extensions/font-size";
import { Toolbar } from "./toolbar";
import { LinkBubbleMenu } from "./link-bubble-menu";

interface EditorProps {
  initialContent?: string;
}

const CustomLink = Link.extend({
  renderHTML({ HTMLAttributes }) {
    const { href, ...rest } = HTMLAttributes;
    return ["a", { ...rest, "data-href": href, style: "cursor: text" }, 0];
  },
});

export function Editor({ initialContent = "" }: EditorProps) {
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
      <EditorProvider
        slotBefore={
          <div className="sticky top-0 z-10 w-full bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-2 flex justify-center shadow-sm">
            <div className="w-full max-w-[816px]">
              <Toolbar />
            </div>
          </div>
        }
        extensions={[
          StarterKit.configure({
            code: false,
            codeBlock: false,
            horizontalRule: false,
            blockquote: false,
            bulletList: false,
            orderedList: false,
          }),
          TextStyle,
          Color,
          Underline,
          Highlight,
          Image,
          FontSize,
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
        content={initialContent}
        editorProps={{
          attributes: {
            class:
              "editor-page-bg prose prose-zinc dark:prose-invert max-w-[816px] w-full min-h-[1056px] mx-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-md px-16 py-20 my-8 focus:outline-none prose-p:m-0 prose-p:leading-[1.2] prose-headings:m-0 prose-headings:mb-2 prose-headings:leading-tight prose-ul:m-0 prose-ol:m-0 prose-li:m-0 leading-[1.2] prose-a:text-blue-600 prose-a:underline dark:prose-a:text-blue-400 cursor-text [&_strong]:text-inherit",
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
              const isLinkBefore = $from.nodeBefore?.marks.some((mark: any) => mark.type.name === "link");
              const isLinkAfter = $from.nodeAfter?.marks.some((mark: any) => mark.type.name === "link");
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
              const isLinkBefore = $from.nodeBefore?.marks.some((mark: any) => mark.type.name === "link");
              const isLinkAfter = $from.nodeAfter?.marks.some((mark: any) => mark.type.name === "link");
              if (!isLinkBefore && !isLinkAfter) {
                editor.commands.unsetLink();
              }
            }
          }
        }}
      >
        <LinkBubbleMenu />
      </EditorProvider>
    </div>
  );
}
