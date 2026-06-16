"use client";

import { Editor } from "@tiptap/react";
import { Table, Trash2, Rows, Columns, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TableControlProps {
  editor: Editor;
}

export function TableControl({ editor }: TableControlProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${
                editor.isActive("table")
                  ? "bg-zinc-200 dark:bg-zinc-800"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Table className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Table</TooltipContent>
      </Tooltip>

      <DropdownMenuContent 
        align="start" 
        className="w-48 p-1"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div
          onClick={() => {
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
            setOpen(false);
          }}
          className="relative flex w-full cursor-default items-center gap-1.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Table className="h-4 w-4 mr-2" />
          Insert Table (3x3)
        </div>

        <DropdownMenuSeparator />

        <div
          onClick={() => {
            if (editor.isActive("table")) {
              editor.chain().focus().addRowBefore().run();
              setOpen(false);
            }
          }}
          className={`relative flex w-full cursor-default items-center gap-1.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none ${!editor.isActive("table") ? "opacity-50 pointer-events-none" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
        >
          <Rows className="h-4 w-4 mr-2" />
          Add Row Before
        </div>
        <div
          onClick={() => {
            if (editor.isActive("table")) {
              editor.chain().focus().addRowAfter().run();
              setOpen(false);
            }
          }}
          className={`relative flex w-full cursor-default items-center gap-1.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none ${!editor.isActive("table") ? "opacity-50 pointer-events-none" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Row After
        </div>
        <div
          onClick={() => {
            if (editor.isActive("table")) {
              editor.chain().focus().deleteRow().run();
              setOpen(false);
            }
          }}
          className={`relative flex w-full cursor-default items-center gap-1.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none ${!editor.isActive("table") ? "opacity-50 pointer-events-none" : "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"}`}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Row
        </div>

        <DropdownMenuSeparator />

        <div
          onClick={() => {
            if (editor.isActive("table")) {
              editor.chain().focus().addColumnBefore().run();
              setOpen(false);
            }
          }}
          className={`relative flex w-full cursor-default items-center gap-1.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none ${!editor.isActive("table") ? "opacity-50 pointer-events-none" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
        >
          <Columns className="h-4 w-4 mr-2" />
          Add Column Before
        </div>
        <div
          onClick={() => {
            if (editor.isActive("table")) {
              editor.chain().focus().addColumnAfter().run();
              setOpen(false);
            }
          }}
          className={`relative flex w-full cursor-default items-center gap-1.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none ${!editor.isActive("table") ? "opacity-50 pointer-events-none" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Column After
        </div>
        <div
          onClick={() => {
            if (editor.isActive("table")) {
              editor.chain().focus().deleteColumn().run();
              setOpen(false);
            }
          }}
          className={`relative flex w-full cursor-default items-center gap-1.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none ${!editor.isActive("table") ? "opacity-50 pointer-events-none" : "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"}`}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Column
        </div>

        <DropdownMenuSeparator />

        <div
          onClick={() => {
            if (editor.isActive("table")) {
              editor.chain().focus().deleteTable().run();
              setOpen(false);
            }
          }}
          className={`relative flex w-full cursor-default items-center gap-1.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none ${!editor.isActive("table") ? "opacity-50 pointer-events-none" : "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"}`}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Table
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
