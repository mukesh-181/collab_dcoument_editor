import { useCurrentEditor, BubbleMenu } from "@tiptap/react";
import { Bold, Italic, Underline, Highlighter } from "lucide-react";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useDocumentSync } from "@/features/document/components/page/document-context";

export function FormattingBubbleMenu() {
  const { editor } = useCurrentEditor();
  const { currentUserRole } = useDocumentSync();

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: "top" }}
      shouldShow={({ editor, state }) => {
        if (currentUserRole === 'viewer') return false;
        const { empty } = state.selection;
        const hasLinkMark = editor.isActive("link");
        const hasImage = editor.isActive("image");
        
        return !empty && !hasLinkMark && !hasImage;
      }}
      updateDelay={250}
      className="flex items-center gap-1 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl rounded-xl p-1.5"
    >
      <TooltipProvider>
        <TooltipWrapper title="Bold">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-7 w-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 ${
            editor.isActive("bold") ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" : "text-zinc-700 dark:text-zinc-300"
          }`}
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
      </TooltipWrapper>

      <TooltipWrapper title="Italic">
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-7 w-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 ${
            editor.isActive("italic") ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" : "text-zinc-700 dark:text-zinc-300"
          }`}
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
      </TooltipWrapper>

      <TooltipWrapper title="Underline">
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`h-7 w-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 ${
            editor.isActive("underline") ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" : "text-zinc-700 dark:text-zinc-300"
          }`}
        >
          <Underline className="h-3.5 w-3.5" />
        </button>
      </TooltipWrapper>

      <Separator orientation="vertical" className="h-4 mx-0.5 bg-zinc-200 dark:bg-zinc-700" />

      <TooltipWrapper title="Highlight">
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`h-7 w-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 ${
            editor.isActive("highlight") ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" : "text-zinc-700 dark:text-zinc-300"
          }`}
        >
          <Highlighter className="h-3.5 w-3.5" />
        </button>
      </TooltipWrapper>
      </TooltipProvider>
    </BubbleMenu>
  );
}
