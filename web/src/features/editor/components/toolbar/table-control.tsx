"use client";

import { Editor } from "@tiptap/react";
import { Table, Trash2, Rows, Columns, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TableControlProps {
  editor: Editor;
}

export function TableControl({ editor }: TableControlProps) {
  return (
    <DropdownMenu>
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

      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <Table className="h-4 w-4 mr-2" />
          Insert Table (3x3)
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => editor.chain().focus().addRowBefore().run()}
          disabled={!editor.isActive("table")}
        >
          <Rows className="h-4 w-4 mr-2" />
          Add Row Before
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!editor.isActive("table")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Row After
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().deleteRow().run()}
          disabled={!editor.isActive("table")}
          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Row
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          disabled={!editor.isActive("table")}
        >
          <Columns className="h-4 w-4 mr-2" />
          Add Column Before
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!editor.isActive("table")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Column After
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().deleteColumn().run()}
          disabled={!editor.isActive("table")}
          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Column
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => editor.chain().focus().deleteTable().run()}
          disabled={!editor.isActive("table")}
          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Table
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
