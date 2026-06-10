import { Editor } from "@tiptap/react";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";

export function ColorControl({ editor }: { editor: Editor }) {
  const currentColor = editor.getAttributes("textStyle").color || "#000000";

  return (
    <TooltipWrapper
      title="Text Color"
      description="Change the font color of selected text."
    >
      <div className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ml-1">
        <div
          className="relative h-5 w-5 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden"
          style={{ backgroundColor: currentColor }}
        >
          <input
            type="color"
            value={currentColor}
            onChange={(e) => {
              const newColor = e.target.value;
              editor.chain().focus().setColor(newColor).run();
            }}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            title="Text Color"
          />
        </div>
      </div>
    </TooltipWrapper>
  );
}
