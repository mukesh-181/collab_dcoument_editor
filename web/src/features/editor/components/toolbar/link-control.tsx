import { useState } from "react";
import { Link2, Unlink } from "lucide-react";
import { Editor } from "@tiptap/react";
import type { Mark } from "@tiptap/pm/model";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";

export function LinkControl({ editor }: { editor: Editor }) {
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [isTextSelected, setIsTextSelected] = useState(false);

  const handleLinkOpenChange = (open: boolean) => {
    setIsLinkPopoverOpen(open);
    if (open && editor) {
      const { empty, from, to } = editor.state.selection;
      if (!empty) {
        setIsTextSelected(true);
        setLinkText(editor.state.doc.textBetween(from, to, " "));
      } else {
        setIsTextSelected(false);
        setLinkText("");
      }
      setLinkUrl(editor.getAttributes("link").href || "");
    }
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setIsLinkPopoverOpen(false);
      return;
    }

    if (isTextSelected) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
    } else {
      if (!linkText) return;
      editor
        .chain()
        .focus()
        .insertContent([
          {
            type: "text",
            text: linkText,
            marks: [
              {
                type: "link",
                attrs: { href: linkUrl },
              },
            ],
          },
          {
            type: "text",
            text: " ",
          },
        ])
        .run();
    }

    setIsLinkPopoverOpen(false);
    setLinkUrl("");
    setLinkText("");
  };

  const isLinkActive = () => {
    if (!editor.isActive("link")) return false;
    const { empty, $from } = editor.state.selection;
    if (empty) {
      const isLinkBefore = $from.nodeBefore?.marks.some(
        (mark: Mark) => mark.type.name === "link",
      );
      const isLinkAfter = $from.nodeAfter?.marks.some(
        (mark: Mark) => mark.type.name === "link",
      );
      if (!isLinkBefore && !isLinkAfter) {
        return false;
      }
    }
    return true;
  };

  return (
    <>
      <Popover open={isLinkPopoverOpen} onOpenChange={handleLinkOpenChange}>
        <TooltipWrapper
          title="Add Link"
          description="Turn selected text into a clickable URL."
        >
          <PopoverTrigger asChild>
            <button
              className={`h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 ${
                isLinkActive()
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-200"
                  : ""
              }`}
              onMouseDown={(e) => e.preventDefault()}
              aria-label="Set Link"
            >
              <Link2 className="h-4 w-4" />
            </button>
          </PopoverTrigger>
        </TooltipWrapper>
        <PopoverContent 
          className="w-80 p-3" 
          side="bottom" 
          align="start"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <form onSubmit={handleLinkSubmit} className="flex flex-col gap-3">
            <h4 className="font-medium leading-none text-sm">Add Link</h4>

            {!isTextSelected && (
              <div className="flex flex-col gap-1">
                <label htmlFor="link-text" className="text-xs text-zinc-500">
                  Text to display
                </label>
                <Input
                  id="link-text"
                  placeholder="Enter text..."
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="link-url" className="text-xs text-zinc-500">
                URL
              </label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <div className="flex justify-end mt-1">
              <Button type="submit" size="sm" className="h-8">
                Apply
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>

      <TooltipWrapper
        title="Remove Link"
        description="Remove the link from selected text."
      >
        <button
          onClick={() => editor.chain().focus().unsetLink().run()}
          onMouseDown={(e) => e.preventDefault()}
          disabled={!isLinkActive()}
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50"
          aria-label="Unset Link"
        >
          <Unlink className="h-4 w-4" />
        </button>
      </TooltipWrapper>
    </>
  );
}
