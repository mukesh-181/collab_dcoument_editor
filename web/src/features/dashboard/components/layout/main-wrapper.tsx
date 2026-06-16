"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function MainWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Check if we are on a document page
  const isDocumentPage = pathname?.match(/^\/dashboard\/[^/]+$/);

  return (
    <main
      className={`flex-1 flex flex-col min-h-0 w-full ${
        isDocumentPage ? "" : "max-w-7xl mx-auto p-4 sm:p-6 lg:p-0"
      }`}
    >
      {children}
    </main>
  );
}
