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
import {
  TablePlus,
  TableRowPlus,
  TableCellPlus,
  TableHeaderPlus,
} from "tiptap-table-plus";
import { TablePlusNodeView } from "tiptap-table-plus/dist/pagination/TablePlusNodeView";
import { InlineQuote } from "@/features/editor/extensions/inline-quote";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { PaginationPlus } from "tiptap-pagination-plus";
import { FontSize } from "@/features/editor/extensions/font-size";
import {
  SlashCommand,
  slashSuggestion,
} from "@/features/editor/extensions/slash-command";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import type { EditorView } from "@tiptap/pm/view";

const CustomLink = Link.extend({
  renderHTML({ HTMLAttributes }) {
    const { href, ...rest } = HTMLAttributes;
    return ["a", { ...rest, "data-href": href, style: "cursor: text" }, 0];
  },
});

class CustomTablePlusNodeView extends TablePlusNodeView {
  addHandles() {
    const dragHandle = (handle: HTMLDivElement) => {
      const handleIndex = parseInt(handle.dataset.index ?? "0");
      const onMouseMove = (e: MouseEvent) => {
        const rect = this.slider.getBoundingClientRect();
        if (rect.width === 0) return;

        const x = e.clientX - rect.left;

        // Convert mouse position to percent
        const mousePercent = (x / rect.width) * 100;

        // Calculate minimum allowed percent based on previous handle or 0
        const minPercent = (this.options.minColumnSize / rect.width) * 100;
        let minAllowedPercent = minPercent;
        if (handleIndex > 0) {
          const prevPercent = parseFloat(this.handles[handleIndex - 1].style.left);
          minAllowedPercent = prevPercent + minPercent;
        }

        // Calculate maximum allowed percent based on next handle or 100
        let maxAllowedPercent = 100;
        if (handleIndex < this.handles.length - 1) {
          const nextPercent = parseFloat(this.handles[handleIndex + 1].style.left);
          maxAllowedPercent = nextPercent - minPercent;
        }

        // Clamp the percentage
        const percent = Math.max(minAllowedPercent, Math.min(maxAllowedPercent, mousePercent));

        handle.style.left = percent + "%";
        this.updateValues(this.getColumnSizes(this.handles), false);
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        this.updateValues(this.getColumnSizes(this.handles), true);
      };

      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });
    };

    let lastValue = 0;
    for (let index = 0; index < this.cellPercentage.length; index++) {
      lastValue = lastValue + this.cellPercentage[index];
      if (index >= this.handles.length) {
        const handle = document.createElement("div");
        handle.className = "handle";
        handle.style.position = "absolute";
        handle.style.top = "50%";
        handle.style.width = "12px";
        handle.style.height = "12px";
        handle.style.zIndex = "9999";
        handle.style.borderRadius = "50%";
        handle.style.transform = "translate(-50%, -50%)";
        handle.style.cursor = "ew-resize";
        Object.assign(handle.style, this.options.resizeHandleStyle);
        handle.dataset.index = index.toString();
        handle.style.left = `${lastValue}%`;

        this.slider.appendChild(handle);
        this.handles.push(handle);
        dragHandle(handle);
      }
    }
  }

  updateHandlePositions() {
    super.updateHandlePositions();
    this.handles.forEach((handle, index) => {
      if (index === this.cellPercentage.length - 1) {
        handle.style.display = "none";
        handle.style.pointerEvents = "none";
      } else {
        handle.style.display = "";
        handle.style.pointerEvents = "auto";
      }
    });
  }
}

const CustomTablePlus = TablePlus.extend({
  addNodeView() {
    return ({ node, getPos, editor }) => {
      return new CustomTablePlusNodeView(node, getPos, editor, this.options);
    };
  },
});

export interface EditorConfigParams {
  documentId: string;
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  currentUserName: string;
  currentUserImage?: string;
}

export const getEditorExtensions = ({
  documentId,
  ydoc,
  provider,
  currentUserName,
  currentUserImage,
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
    CustomTablePlus.configure({
      resizable: true,
      allowTableNodeSelection: false,
      minColumnSize: 50,
      resizeHandleStyle: {
        background: "#4f46e5", // Solid Indigo 600
        width: "6px",
        height: "2000px", // Full vertical line
        borderRadius: "0",
        top: "0",
        transform: "translate(-50%, 0)",
      },
    }),
    TableRowPlus,
    TableHeaderPlus,
    TableCellPlus,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ResizableImage as any).configure({
      documentId: documentId,
    }),
    FontSize,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TaskList as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (TaskItem as any).configure({
      nested: true,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (SlashCommand as any).configure({
      suggestion: slashSuggestion,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        image: currentUserImage,
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
      "[&_.tableWrapper]:my-4",
      "prose-blockquote:border-l-4 prose-blockquote:border-zinc-300 dark:prose-blockquote:border-zinc-700 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4",
      "prose-q:quotes-['\"'_'\"'] prose-q:italic prose-q:text-zinc-600 dark:prose-q:text-zinc-400",
    ].join(" "),
  },
  handleClick: (view: EditorView, pos: number, event: MouseEvent) => {
    void view;
    void pos;
    const target = event.target as HTMLElement;
    if (target && target.closest("a")) {
      event.preventDefault();
      return false;
    }
    return false;
  },
};
