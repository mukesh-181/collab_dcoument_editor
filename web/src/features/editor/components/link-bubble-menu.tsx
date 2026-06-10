"use client";

import { useCurrentEditor, BubbleMenu } from "@tiptap/react";
import { Copy, Edit2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export function LinkBubbleMenu() {
  const { editor } = useCurrentEditor();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editUrl, setEditUrl] = useState("");

  if (!editor) return null;

  const getLinkUrl = () => editor.getAttributes("link").href;

  const handleCopy = () => {
    const url = getLinkUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  const handleUnlink = () => {
    editor.chain().focus().unsetLink().run();
    setIsEditOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editUrl) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: editUrl }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setIsEditOpen(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }: any) => {
        if (isEditOpen) return false;
        
        const hasLinkMark = editor.isActive("link");
        if (!hasLinkMark) return false;

        const { empty, $from } = editor.state.selection;
        if (empty) {
          // Check if the link actually exists in the document nodes surrounding the cursor,
          // rather than just being an active "stored mark" on an empty paragraph after deletion.
          const isLinkBefore = $from.nodeBefore?.marks.some((mark: any) => mark.type.name === 'link');
          const isLinkAfter = $from.nodeAfter?.marks.some((mark: any) => mark.type.name === 'link');
          if (!isLinkBefore && !isLinkAfter) {
            return false;
          }
        }

        return true;
      }}
      className="flex items-center gap-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-md rounded-md p-1"
    >
      <TooltipProvider>
        <span 
          className="text-xs text-blue-600 dark:text-blue-400 max-w-[200px] truncate px-2"
          title={getLinkUrl()}
        >
          {getLinkUrl()}
        </span>

        <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
              <Copy className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Copy link</TooltipContent>
        </Tooltip>

        <Popover open={isEditOpen} onOpenChange={(open) => {
          setIsEditOpen(open);
          if (open) setEditUrl(getLinkUrl() || "");
        }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Edit2 className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">Edit link</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-80 p-3" side="top" align="center">
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
              <h4 className="font-medium leading-none text-sm">Edit Link</h4>
              <div className="flex flex-col gap-1">
                <label htmlFor="edit-link-url" className="text-xs text-zinc-500">URL</label>
                <Input
                  id="edit-link-url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 mt-1">
                <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8">
                  Save
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleUnlink}>
              <Unlink className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Remove link</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </BubbleMenu>
  );
}
