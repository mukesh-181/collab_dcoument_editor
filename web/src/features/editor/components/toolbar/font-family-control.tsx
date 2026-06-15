"use client";

import { Editor } from "@tiptap/react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FontFamilyControlProps {
  editor: Editor;
}

const FONTS = [
  { name: "Inter", value: "Inter, sans-serif" },
  { name: "Roboto", value: "Roboto, sans-serif" },
  { name: "System Default", value: "system-ui, sans-serif" },
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Helvetica", value: "Helvetica, sans-serif" },
  { name: "Times New Roman", value: "'Times New Roman', serif" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Courier New", value: "'Courier New', monospace" },
  { name: "Verdana", value: "Verdana, sans-serif" },
  { name: "Tahoma", value: "Tahoma, sans-serif" },
  { name: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { name: "Comic Sans MS", value: "'Comic Sans MS', cursive" },
  { name: "Impact", value: "Impact, sans-serif" },
];

export function FontFamilyControl({ editor }: FontFamilyControlProps) {
  // Try to determine the currently active font
  const currentFontValue = FONTS.find(f => editor.isActive("textStyle", { fontFamily: f.value }))?.value;
  const currentFontName = FONTS.find(f => f.value === currentFontValue)?.name || "Font";

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 w-32 justify-between"
            >
              <span className="truncate">{currentFontName}</span>
              <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Font Family</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="start" className="w-48 max-h-[300px] overflow-y-auto">
        <DropdownMenuItem
          onClick={() => editor.chain().focus().unsetFontFamily().run()}
          className={!currentFontValue ? "bg-zinc-100 dark:bg-zinc-800" : ""}
        >
          <span style={{ fontFamily: "inherit" }}>Default</span>
        </DropdownMenuItem>
        
        {FONTS.map((font) => (
          <DropdownMenuItem
            key={font.value}
            onClick={() => editor.chain().focus().setFontFamily(font.value).run()}
            className={currentFontValue === font.value ? "bg-zinc-100 dark:bg-zinc-800" : ""}
          >
            <span style={{ fontFamily: font.value }}>{font.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
