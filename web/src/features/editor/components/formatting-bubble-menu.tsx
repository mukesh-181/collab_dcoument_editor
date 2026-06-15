import { useCurrentEditor, BubbleMenu } from "@tiptap/react";
import { Bold, Italic, Underline, Highlighter } from "lucide-react";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";

export function FormattingBubbleMenu() {
  const { editor } = useCurrentEditor();

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: "top" }}
      shouldShow={({ editor, state }) => {
        const { empty } = state.selection;
        const hasLinkMark = editor.isActive("link");
        const hasImage = editor.isActive("image");
        
        return !empty && !hasLinkMark && !hasImage;
      }}
      className="flex items-center gap-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-md rounded-md p-1"
    >
      <TooltipProvider>
        <TooltipWrapper title="Bold">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-7 w-7 flex items-center justify-center rounded-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 ${
            editor.isActive("bold") ? "bg-zinc-200 dark:bg-zinc-800" : ""
          }`}
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
      </TooltipWrapper>

      <TooltipWrapper title="Italic">
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-7 w-7 flex items-center justify-center rounded-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 ${
            editor.isActive("italic") ? "bg-zinc-200 dark:bg-zinc-800" : ""
          }`}
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
      </TooltipWrapper>

      <TooltipWrapper title="Underline">
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`h-7 w-7 flex items-center justify-center rounded-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 ${
            editor.isActive("underline") ? "bg-zinc-200 dark:bg-zinc-800" : ""
          }`}
        >
          <Underline className="h-3.5 w-3.5" />
        </button>
      </TooltipWrapper>

      <Separator orientation="vertical" className="h-4 mx-0.5 bg-zinc-200 dark:bg-zinc-700" />

      <TooltipWrapper title="Highlight">
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`h-7 w-7 flex items-center justify-center rounded-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 ${
            editor.isActive("highlight") ? "bg-zinc-200 dark:bg-zinc-800" : ""
          }`}
        >
          <Highlighter className="h-3.5 w-3.5" />
        </button>
      </TooltipWrapper>
      </TooltipProvider>
    </BubbleMenu>
  );
}
