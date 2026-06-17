"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { useCurrentEditor } from "@tiptap/react";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";

import { HistoryControls } from "./toolbar/history-controls";
import { HeadingControls } from "./toolbar/heading-controls";
import { FontSizeControl } from "./toolbar/font-size-control";
import { FormatControls } from "./toolbar/format-controls";
import { ColorControl } from "./toolbar/color-control";
import { LinkControl } from "./toolbar/link-control";
import { ImageControl } from "./toolbar/image-control";
import { AlignmentControls } from "./toolbar/alignment-controls";
import { ListControls } from "./toolbar/list-controls";
import { FontFamilyControl } from "./toolbar/font-family-control";
import { HighlightControl } from "./toolbar/highlight-control";
import { TableControl } from "./toolbar/table-control";


export function Toolbar({ documentId }: { documentId: string }) {
  const { editor } = useCurrentEditor();
  const [, forceUpdate] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      if (timeoutRef.current) return;
      
      timeoutRef.current = setTimeout(() => {
        startTransition(() => {
          forceUpdate((n) => n + 1);
        });
        timeoutRef.current = null;
      }, 250);
    };

    // Listen to selection and content changes
    editor.on("transaction", handleUpdate);

    return () => {
      editor.off("transaction", handleUpdate);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="editor-toolbar-container flex items-center justify-center gap-1 px-2 py-2 w-full overflow-x-auto whitespace-nowrap">
        <HistoryControls editor={editor} />
        
        <Separator
          orientation="vertical"
          className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700"
        />

        <HeadingControls editor={editor} />

        <Separator
          orientation="vertical"
          className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700"
        />

        <FontFamilyControl editor={editor} />
        <Separator
          orientation="vertical"
          className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700"
        />
        <FontSizeControl editor={editor} />

        <Separator
          orientation="vertical"
          className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700"
        />

        <FormatControls editor={editor} />
        <ColorControl editor={editor} />
        <HighlightControl editor={editor} />

        <Separator
          orientation="vertical"
          className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700"
        />

        <LinkControl editor={editor} />
        <ImageControl editor={editor} documentId={documentId} />
        <TableControl editor={editor} />

        <Separator
          orientation="vertical"
          className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700"
        />

        <ListControls editor={editor} />

        <Separator
          orientation="vertical"
          className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700"
        />

        <AlignmentControls editor={editor} />
      </div>
    </TooltipProvider>
  );
}
