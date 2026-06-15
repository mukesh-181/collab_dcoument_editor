import { Editor } from "@tiptap/react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

const FONT_SIZES = [
  "8px",
  "10px",
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "30px",
  "36px",
  "48px",
  "60px",
  "72px",
];

export function FontSizeControl({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);

  const getCurrentFontSize = () => {
    const inlineSize = editor.getAttributes("textStyle").fontSize;
    if (inlineSize) return inlineSize;

    if (editor.isActive("heading", { level: 1 })) return "36px";
    if (editor.isActive("heading", { level: 2 })) return "24px";
    if (editor.isActive("heading", { level: 3 })) return "20px";

    return "16px";
  };

  return (
    <div className="flex items-center ml-1 mr-1">
      <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            className="h-8 w-20 px-2 text-xs font-medium justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <span className="truncate">{getCurrentFontSize()}</span>
            <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-20 min-w-0 max-h-[300px] overflow-y-auto"
          onCloseAutoFocus={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {FONT_SIZES.map((size) => (
            <div 
              key={size} 
              className="text-xs justify-center relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1.5 px-2 outline-hidden select-none hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => {
                editor.chain().focus().setFontSize(size).run();
                setOpen(false);
              }}
            >
              {size}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
