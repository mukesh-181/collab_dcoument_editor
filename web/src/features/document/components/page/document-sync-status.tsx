"use client";

import { useDocumentSync } from "./document-context";
import { Cloud, CloudOff, CloudUpload } from "lucide-react";

export function DocumentSyncStatus() {
  const { syncState } = useDocumentSync();

  return (
    <div className="flex items-center gap-1.5 mt-0.5">
      {syncState === "saving" && (
        <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
          <CloudUpload className="h-2 w-2 animate-pulse" />
          <span>Saving changes...</span>
        </div>
      )}
      {syncState === "saved" && (
        <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
          <Cloud className="h-2 w-2" />
          <span>Changes will save automatically</span>
        </div>
      )}
      {syncState === "offline" && (
        <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-500">
          <CloudOff className="h-2 w-2 " />
          <span>Offline - Will save when reconnected</span>
        </div>
      )}
    </div>
  );
}
