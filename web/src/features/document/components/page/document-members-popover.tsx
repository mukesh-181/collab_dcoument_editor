"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, Pencil, Eye } from "lucide-react";

interface DocumentMembersPopoverProps {
  members?: {
    role: string;
    user: {
      id: string;
      name: string;
      image: string;
      email: string;
    };
  }[];
}

export function DocumentMembersPopover({ members }: DocumentMembersPopoverProps) {
  if (!members || members.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center -space-x-2 mr-2 focus:outline-none cursor-pointer group">
          {members.map((member) => (
            <Avatar
              key={member.user.id}
              className="w-8 h-8 border-2 border-white dark:border-zinc-950 transition-transform group-hover:scale-105"
            >
              <AvatarImage
                src={member.user.image || ""}
                alt={member.user.name || "User"}
              />
              <AvatarFallback className="text-[10px]">
                {(member.user.name || member.user.email || "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-80 p-0 shadow-lg rounded-xl overflow-hidden border-zinc-200 dark:border-zinc-800"
      >
        <div className="bg-zinc-50/80 dark:bg-zinc-900/50 p-4 border-b border-zinc-100 dark:border-zinc-800 backdrop-blur-sm flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm shrink-0">
            <Users className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
              Document Members
            </h3>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {members.length} people have access
            </p>
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin">
          {members.map((member) => (
            <div
              key={member.user.id}
              className="flex items-center justify-between p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <Avatar className="w-9 h-9 border border-zinc-200 dark:border-zinc-800 shrink-0 shadow-sm">
                  <AvatarImage
                    src={member.user.image || ""}
                    alt={member.user.name || "User"}
                  />
                  <AvatarFallback>
                    {(member.user.name || member.user.email || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[14px] font-medium text-zinc-900 dark:text-zinc-50 truncate leading-snug">
                    {member.user.name || (member.user.email ? member.user.email.split('@')[0] : "Anonymous User")}
                  </span>
                  <span className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate leading-snug">
                    {member.user.email}
                  </span>
                </div>
              </div>
              <div className="ml-3 shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-default select-none">
                {member.role === "editor" || member.role === "owner" ? (
                  <Pencil className="h-3 w-3 text-zinc-500" />
                ) : (
                  <Eye className="h-3 w-3 text-zinc-500" />
                )}
                <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 capitalize">
                  {member.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
