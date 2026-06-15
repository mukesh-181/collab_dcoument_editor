"use client";

import { Editor } from "@tiptap/react";
import { Highlighter } from "lucide-react";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";

export function HighlightControl({ editor }: { editor: Editor }) {
  const currentHighlightColor = editor.getAttributes("highlight").color || "#ffff00";

  return (
    <TooltipWrapper
      title="Highlight Color"
      description="Change the highlight color of selected text."
    >
      <div className="relative flex flex-col items-center justify-center h-8 w-8 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer mx-1">
        <Highlighter className="h-4 w-4" />
        <div 
          className="absolute bottom-1 w-4 h-1 rounded-sm"
          style={{ backgroundColor: editor.isActive("highlight") ? currentHighlightColor : "transparent" }}
        />
        <input
          type="color"
          value={currentHighlightColor}
          onChange={(e) => {
            const newColor = e.target.value;
            editor.chain().focus().setHighlight({ color: newColor }).run();
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title="Highlight Color"
        />
      </div>
    </TooltipWrapper>
  );
}
