"use client";

import { useDocumentSync } from "./document-context";
import { DocumentSkeleton } from "./document-skeleton";

export function DocumentClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isEditorReady } = useDocumentSync();

  return (
    <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden bg-white dark:bg-zinc-950">
      {!isEditorReady && (
        <div className="absolute inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col">
          <DocumentSkeleton />
        </div>
      )}
      
      {/* We keep the children mounted but hidden so they can initialize the WebSockets and state in the background */}
      <div
        className={`flex flex-col flex-1 min-h-0 ${
          !isEditorReady ? "opacity-0 pointer-events-none absolute inset-0" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}
