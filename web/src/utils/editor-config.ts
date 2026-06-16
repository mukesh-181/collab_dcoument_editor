"use client";

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import { ResizableImage } from "@/features/editor/extensions/resizable-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import FontFamily from "@tiptap/extension-font-family";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { InlineQuote } from "@/features/editor/extensions/inline-quote";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { PaginationPlus } from "tiptap-pagination-plus";
import { FontSize } from "@/features/editor/extensions/font-size";
import { SlashCommand, slashSuggestion } from "@/features/editor/extensions/slash-command";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

const CustomLink = Link.extend({
  renderHTML({ HTMLAttributes }) {
    const { href, ...rest } = HTMLAttributes;
    return ["a", { ...rest, "data-href": href, style: "cursor: text" }, 0];
  },
});

export interface EditorConfigParams {
  documentId: string;
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  currentUserName: string;
}

export const getEditorExtensions = ({
  documentId,
  ydoc,
  provider,
  currentUserName,
}: EditorConfigParams) => {
  return [
    StarterKit.configure({
      codeBlock: false,
      horizontalRule: false,
      bulletList: {},
      orderedList: {},
      history: false,
    }),
    TextStyle,
    Color,
    FontFamily,
    InlineQuote,
    Underline,
    Highlight.configure({
      multicolor: true,
    }),
    Table.configure({
      resizable: false,
      HTMLAttributes: {
        class: "w-full",
      },
    }),
    TableRow,
    TableHeader,
    TableCell,
    (ResizableImage as any).configure({
      documentId: documentId,
    }),
    FontSize,
    TaskList as any,
    (TaskItem as any).configure({
      nested: true,
    }),
    (SlashCommand as any).configure({
      suggestion: slashSuggestion,
    }),
    (PaginationPlus as any).configure({
      pageHeight: 1123,
      pageWidth: 794,
      marginTop: 72,
      marginBottom: 72,
      marginLeft: 64,
      marginRight: 64,
      contentMarginTop: 8,
      contentMarginBottom: 8,
      pageGap: 40,
      pageGapBorderColor: "transparent",
      pageBreakBackground: "var(--rm-page-break-bg, #f4f4f5)",
      footerRight: "Page {page}",
      footerLeft: "",
      headerLeft: "",
      headerRight: "",
    }),
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
      types: ["heading", "paragraph", "listItem", "taskItem"],
    }),
    Placeholder.configure({
      placeholder: "Start typing here...",
      emptyEditorClass: "is-editor-empty",
    }),
  ];
};

export const editorPropsConfig = {
  attributes: {
    class: [
      "prose prose-zinc dark:prose-invert max-w-none mx-auto bg-white dark:bg-zinc-950 focus:outline-none cursor-text leading-[1.2]",
      "[&_strong]:text-inherit prose-a:text-blue-600 prose-a:underline dark:prose-a:text-blue-400",
      "prose-p:m-0 prose-p:leading-[1.2]",
      "prose-headings:m-0 prose-headings:mb-2 prose-headings:leading-tight",
      "prose-ul:my-2 prose-ul:pl-6 prose-ul:list-disc",
      "prose-ol:my-2 prose-ol:pl-6 prose-ol:list-decimal",
      "prose-li:my-1 prose-li:marker:text-zinc-400",
      "[&_.tableWrapper]:w-full [&_.tableWrapper]:my-4 [&_.tableWrapper]:relative",
      "[&_table]:w-full [&_table]:border-collapse [&_table]:table-fixed [&_table]:!my-0",
      "[&_td]:border [&_td]:border-zinc-300 dark:[&_td]:border-zinc-700 [&_td]:p-2 [&_td]:relative",
      "[&_th]:border [&_th]:border-zinc-300 dark:[&_th]:border-zinc-700 [&_th]:p-2 [&_th]:bg-zinc-100 dark:[&_th]:bg-zinc-800 [&_th]:text-left [&_th]:font-semibold [&_th]:relative",
      "[&_table_p]:m-0",
      "prose-blockquote:border-l-4 prose-blockquote:border-zinc-300 dark:prose-blockquote:border-zinc-700 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4",
      "prose-q:quotes-['\"'_'\"'] prose-q:italic prose-q:text-zinc-600 dark:prose-q:text-zinc-400"
    ].join(" "),
  },
  handleClick: (view: any, pos: any, event: any) => {
    const target = event.target as HTMLElement;
    if (target && target.closest("a")) {
      event.preventDefault();
      return false;
    }
    return false;
  },
};
