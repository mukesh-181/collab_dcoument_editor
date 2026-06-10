import { Undo, Redo } from "lucide-react";
import { Editor } from "@tiptap/react";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";

export function HistoryControls({ editor }: { editor: Editor }) {
  return (
    <>
      <TooltipWrapper title="Undo" description="Undo the last action.">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          onMouseDown={(e) => e.preventDefault()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50"
          aria-label="Undo"
        >
          <Undo className="h-4 w-4" />
        </button>
      </TooltipWrapper>

      <TooltipWrapper title="Redo" description="Redo the last undone action.">
        <button
          onClick={() => editor.chain().focus().redo().run()}
          onMouseDown={(e) => e.preventDefault()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50"
          aria-label="Redo"
        >
          <Redo className="h-4 w-4" />
        </button>
      </TooltipWrapper>
    </>
  );
}
