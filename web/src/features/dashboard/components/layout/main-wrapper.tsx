"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef } from "react";

export function MainWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  
  // Check if we are on a document page
  const isDocumentPage = pathname?.match(/^\/dashboard\/[^/]+$/);

  // Next.js layout preservation keeps the DOM node alive between routes.
  // Because this main element has overflow-y-auto, we must manually reset 
  // its scroll position when the user navigates between documents.
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [pathname]);

  return (
    <main
      ref={mainRef}
      className={`flex-1 flex flex-col min-h-0 w-full ${
        isDocumentPage ? "overflow-y-auto" : "max-w-7xl mx-auto p-4 sm:p-6 lg:p-0"
      }`}
    >
      {children}
    </main>
  );
}
