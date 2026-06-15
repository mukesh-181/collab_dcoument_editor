import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from "react";

export const TooltipWrapper = ({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
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
      {description && (
        <span className="text-zinc-300 text-[10px] leading-tight">
          {description}
        </span>
      )}
    </TooltipContent>
  </Tooltip>
);
