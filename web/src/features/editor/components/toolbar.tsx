"use client";

import { useEffect, useRef, useState } from "react";
import { useCurrentEditor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Code,
  SquareCode,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Unlink,
  ImageIcon,
  Undo,
  Redo,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TooltipWrapper = ({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) => (
  <Tooltip delayDuration={300}>
    <TooltipTrigger asChild>
      <div className="flex">{children}</div>
    </TooltipTrigger>
    <TooltipContent
      side="bottom"
      className="flex flex-col gap-1 max-w-[200px] z-[100]"
    >
      <span className="font-semibold text-xs">{title}</span>
      <span className="text-zinc-300 text-[10px] leading-tight">
        {description}
      </span>
    </TooltipContent>
  </Tooltip>
);

export function Toolbar() {
  const { editor } = useCurrentEditor();
  const [, forceUpdate] = useState(0);

  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [isTextSelected, setIsTextSelected] = useState(false);

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

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      forceUpdate((n) => n + 1);
    };

    // Listen to selection and content changes
    editor.on("transaction", handleUpdate);

    return () => {
      editor.off("transaction", handleUpdate);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const toggleClass =
    "data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900 dark:data-[state=on]:bg-blue-900/50 dark:data-[state=on]:text-blue-200 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-800";

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
        (mark: any) => mark.type.name === "link",
      );
      const isLinkAfter = $from.nodeAfter?.marks.some(
        (mark: any) => mark.type.name === "link",
      );
      if (!isLinkBefore && !isLinkAfter) {
        return false;
      }
    }
    return true;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      editor.chain().focus().setImage({ src: url }).run();
      // Reset input to allow selecting the same file again
      e.target.value = "";
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const getCurrentFontSize = () => {
    // 1. Check inline text style first (highest priority)
    const inlineSize = editor.getAttributes("textStyle").fontSize;
    if (inlineSize) return inlineSize;

    // 2. Fallback to default heading pixel mappings
    if (editor.isActive("heading", { level: 1 })) return "36px";
    if (editor.isActive("heading", { level: 2 })) return "24px";
    if (editor.isActive("heading", { level: 3 })) return "20px";

    return "16px";
  };

  const currentColor = editor.getAttributes("textStyle").color || "#000000";

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-1 px-2 py-2 w-full whitespace-nowrap">
        {/* History */}
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

        <Separator
          orientation="vertical"
          className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700"
        />

        {/* Headings */}
        <TooltipWrapper
          title="Heading 1"
          description="Largest section heading."
        >
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

        <Separator
          orientation="vertical"
          className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700"
        />

        {/* Font Size */}
        <div className="flex items-center ml-1 mr-1">
          <Select
            value={getCurrentFontSize()}
            onValueChange={(value) => {
              editor.chain().focus().setFontSize(value).run();
            }}
          >
            <SelectTrigger className="h-8 w-20 text-xs font-medium focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent position="popper">
              {FONT_SIZES.map((size) => (
                <SelectItem key={size} value={size} className="text-xs">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator
          orientation="vertical"
          className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700"
        />

        {/* Formatting */}
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
            onPressedChange={() =>
              editor.chain().focus().toggleUnderline().run()
            }
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
            onPressedChange={() =>
              editor.chain().focus().toggleHighlight().run()
            }
            onMouseDown={(e) => e.preventDefault()}
            aria-label="Toggle highlight"
            className={toggleClass}
          >
            <Highlighter className="h-4 w-4" />
          </Toggle>
        </TooltipWrapper>

        {/* Color Picker */}
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

        <Separator
          orientation="vertical"
          className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700"
        />

        {/* Media & Links */}
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
                aria-label="Set Link"
              >
                <Link2 className="h-4 w-4" />
              </button>
            </PopoverTrigger>
          </TooltipWrapper>
          <PopoverContent className="w-80 p-3" side="bottom" align="start">
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
                  autoFocus={isTextSelected}
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

        <TooltipWrapper
          title="Embed Image"
          description="Upload an image from your PC."
        >
          <button
            onClick={triggerImageUpload}
            onMouseDown={(e) => e.preventDefault()}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800"
            aria-label="Add Image"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
        </TooltipWrapper>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

        <Separator
          orientation="vertical"
          className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700"
        />

        {/* Alignment */}
        <TooltipWrapper
          title="Align Left"
          description="Align text to the left margin."
        >
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "left" })}
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
      </div>
    </TooltipProvider>
  );
}
