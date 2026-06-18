"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDocumentSync } from "./document-context";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getInitials } from "@/utils/string-utils";
import { extractUserInfo } from "@/utils/user-utils";



export function ActiveUsersCluster() {
  const { activeUsers } = useDocumentSync();

  if (activeUsers.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-1 mr-4 border-r border-zinc-200 dark:border-zinc-800 pr-4">
        {activeUsers.map((activeUser) => {
          const { name, image } = extractUserInfo(activeUser.user);
          return (
            <TooltipWrapper
              key={activeUser.clientId}
              title={name}
              description="Online now"
            >
              <Avatar
                className="w-8 h-8 transition-transform hover:scale-105 shadow-sm"
                style={{ border: `2px solid ${activeUser.user.color || "#e4e4e7"}` }}
              >
                <AvatarImage src={image} alt={name} />
                <AvatarFallback className="text-[10px] bg-white text-zinc-900 font-medium">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
            </TooltipWrapper>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
