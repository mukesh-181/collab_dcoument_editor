import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Highlighter,
} from "lucide-react";
import { Editor } from "@tiptap/react";
import { Toggle } from "@/components/ui/toggle";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";

export function FormatControls({ editor }: { editor: Editor }) {
  const toggleClass =
    "data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900 dark:data-[state=on]:bg-blue-900/50 dark:data-[state=on]:text-blue-200 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-800";

  return (
    <>
      <TooltipWrapper title="Bold" description="Make text bold.">
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Toggle bold"
          className={toggleClass}
        >
          <Bold className="h-4 w-4" />
        </Toggle>
      </TooltipWrapper>

      <TooltipWrapper title="Italic" description="Make text italic.">
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Toggle italic"
          className={toggleClass}
        >
          <Italic className="h-4 w-4" />
        </Toggle>
      </TooltipWrapper>

      <TooltipWrapper title="Underline" description="Draw a line under text.">
        <Toggle
          size="sm"
          pressed={editor.isActive("underline")}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Toggle underline"
          className={toggleClass}
        >
          <Underline className="h-4 w-4" />
        </Toggle>
      </TooltipWrapper>

      <TooltipWrapper
        title="Strikethrough"
        description="Draw a line through text."
      >
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Toggle strikethrough"
          className={toggleClass}
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
      </TooltipWrapper>

      <TooltipWrapper
        title="Highlight"
        description="Highlight text with a yellow background."
      >
        <Toggle
          size="sm"
          pressed={editor.isActive("highlight")}
          onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Toggle highlight"
          className={toggleClass}
        >
          <Highlighter className="h-4 w-4" />
        </Toggle>
      </TooltipWrapper>
    </>
  );
}
