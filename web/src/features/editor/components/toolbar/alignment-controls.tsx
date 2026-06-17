import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";
import { Editor } from "@tiptap/react";
import { Toggle } from "@/components/ui/toggle";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";

export function AlignmentControls({ editor }: { editor: Editor }) {
  const toggleClass =
    "data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900 dark:data-[state=on]:bg-blue-900/50 dark:data-[state=on]:text-blue-200 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-800";

  const isCenter = editor.isActive({ textAlign: "center" });
  const isRight = editor.isActive({ textAlign: "right" });
  const isJustify = editor.isActive({ textAlign: "justify" });
  
  // Left is the default alignment in Tiptap if no other alignment is explicitly set
  const isLeft = editor.isActive({ textAlign: "left" }) || (!isCenter && !isRight && !isJustify);

  return (
    <>
      <TooltipWrapper
        title="Align Left"
        description="Align text to the left margin."
      >
        <Toggle
          size="sm"
          pressed={isLeft}
          onPressedChange={() =>
            editor.chain().focus().setTextAlign("left").run()
          }
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Align left"
          className={toggleClass}
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
      </TooltipWrapper>

      <TooltipWrapper
        title="Align Center"
        description="Center text horizontally."
      >
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "center" })}
          onPressedChange={() =>
            editor.chain().focus().setTextAlign("center").run()
          }
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Align center"
          className={toggleClass}
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
      </TooltipWrapper>

      <TooltipWrapper
        title="Align Right"
        description="Align text to the right margin."
      >
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "right" })}
          onPressedChange={() =>
            editor.chain().focus().setTextAlign("right").run()
          }
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Align right"
          className={toggleClass}
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>
      </TooltipWrapper>

      <TooltipWrapper
        title="Justify"
        description="Stretch text to align with both margins."
      >
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "justify" })}
          onPressedChange={() =>
            editor.chain().focus().setTextAlign("justify").run()
          }
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Align justify"
          className={toggleClass}
        >
          <AlignJustify className="h-4 w-4" />
        </Toggle>
      </TooltipWrapper>
    </>
  );
}
