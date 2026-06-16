"use client";

import { useDocumentSync } from "./document-context";
import { CloudOff, CloudUpload, Check } from "lucide-react";

export function DocumentSyncStatus() {
  const { syncState } = useDocumentSync();

  return (
    <div className="flex items-center gap-1.5 mt-0.5">
      {syncState === "saving" && (
        <div className="flex items-center gap-1 text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">
          <CloudUpload className="h-3.5 w-3.5 animate-pulse" />
          <span>Saving...</span>
        </div>
      )}
      {syncState === "saved" && (
        <div className="flex items-center gap-1 text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">
          <Check className="h-3.5 w-3.5" />
          <span>Saved</span>
        </div>
      )}
      {syncState === "offline" && (
        <div className="flex items-center gap-1 text-[13px] text-amber-600 dark:text-amber-500 font-medium">
          <CloudOff className="h-3.5 w-3.5" />
          <span>Offline</span>
        </div>
      )}
    </div>
  );
}
