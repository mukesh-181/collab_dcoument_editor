"use client";

import { useEffect, useState } from "react";
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

export function Toolbar() {
  const { editor } = useCurrentEditor();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      forceUpdate((n) => n + 1);
    };

    // Listen to selection and content changes
    editor.on("transaction", handleUpdate);

    return () => {
      editor.off("transaction", handleUpdate);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-1 px-2 py-2 w-full whitespace-nowrap">
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

        <FontSizeControl editor={editor} />

        <Separator
          orientation="vertical"
          className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700"
        />

        <FormatControls editor={editor} />
        <ColorControl editor={editor} />

        <Separator
          orientation="vertical"
          className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700"
        />

        <LinkControl editor={editor} />
        <ImageControl editor={editor} />

        <Separator
          orientation="vertical"
          className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700"
        />

        <AlignmentControls editor={editor} />
      </div>
    </TooltipProvider>
  );
}
