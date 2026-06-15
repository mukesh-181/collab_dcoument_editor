import { Editor } from "@tiptap/react";
import { List, ListOrdered, CheckSquare } from "lucide-react";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";

export function ListControls({ editor }: { editor: Editor }) {
  const toggleListAndPreserveAlignment = (type: "bullet" | "ordered" | "task") => {
    let alignment: string | null = null;
    if (editor.isActive({ textAlign: "center" })) alignment = "center";
    else if (editor.isActive({ textAlign: "right" })) alignment = "right";
    else if (editor.isActive({ textAlign: "justify" })) alignment = "justify";

    let chain = editor.chain().focus();

    if (type === "bullet") {
      chain = chain.toggleBulletList();
    } else if (type === "ordered") {
      chain = chain.toggleOrderedList();
    } else if (type === "task") {
      chain = chain.toggleTaskList();
    }

    if (alignment) {
      chain = chain.setTextAlign(alignment);
    }

    chain.run();
  };

  return (
    <div className="flex items-center gap-1">
      <TooltipWrapper title="Bullet List" description="Create a bulleted list.">
        <button
          onClick={() => toggleListAndPreserveAlignment("bullet")}
          onMouseDown={(e) => e.preventDefault()}
          className={`h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 ${
            editor.isActive("bulletList") ? "bg-zinc-200 dark:bg-zinc-800" : ""
          }`}
          aria-label="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
      </TooltipWrapper>

      <TooltipWrapper title="Numbered List" description="Create an ordered list.">
        <button
          onClick={() => toggleListAndPreserveAlignment("ordered")}
          onMouseDown={(e) => e.preventDefault()}
          className={`h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 ${
            editor.isActive("orderedList") ? "bg-zinc-200 dark:bg-zinc-800" : ""
          }`}
          aria-label="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </TooltipWrapper>

      <TooltipWrapper title="Checklist" description="Create a task list.">
        <button
          onClick={() => toggleListAndPreserveAlignment("task")}
          onMouseDown={(e) => e.preventDefault()}
          className={`h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 ${
            editor.isActive("taskList") ? "bg-zinc-200 dark:bg-zinc-800" : ""
          }`}
          aria-label="Checklist"
        >
          <CheckSquare className="h-4 w-4" />
        </button>
      </TooltipWrapper>
    </div>
  );
}
