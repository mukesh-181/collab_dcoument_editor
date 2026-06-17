"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useDocumentSync } from "./document-context";
import { EditorSkeleton } from "./document-skeleton";

export function DocumentClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isEditorReady } = useDocumentSync();
  const pathname = usePathname();

  useEffect(() => {
    // Instantly reset the scroll position to the top whenever we enter a document route
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="relative flex flex-col flex-1 bg-transparent">
      {!isEditorReady && (
        <div className="absolute top-0 left-0 right-0 bottom-0 z-50 bg-zinc-50 dark:bg-zinc-950 flex flex-col">
          <EditorSkeleton />
        </div>
      )}
      
      {/* We keep the children mounted but hidden so they can initialize the WebSockets and state in the background */}
      <div
        className={`flex flex-col flex-1 transition-opacity duration-200 ${
          !isEditorReady ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
