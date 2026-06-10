import { Heading1, Heading2, Heading3 } from "lucide-react";
import { Editor } from "@tiptap/react";
import { Toggle } from "@/components/ui/toggle";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";

export function HeadingControls({ editor }: { editor: Editor }) {
  const toggleClass =
    "data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900 dark:data-[state=on]:bg-blue-900/50 dark:data-[state=on]:text-blue-200 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-800";

  return (
    <>
      <TooltipWrapper title="Heading 1" description="Largest section heading.">
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 1 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Toggle heading 1"
          className={toggleClass}
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
      </TooltipWrapper>

      <TooltipWrapper title="Heading 2" description="Medium section heading.">
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Toggle heading 2"
          className={toggleClass}
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
      </TooltipWrapper>

      <TooltipWrapper title="Heading 3" description="Small section heading.">
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 3 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Toggle heading 3"
          className={toggleClass}
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>
      </TooltipWrapper>
    </>
  );
}
