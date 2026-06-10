import { ReactNode } from "react";
import { getUserDocuments } from "../actions/get-user-documents.action";
import { SidebarContent } from "./layout/sidebar-content";

export async function DashboardLayout({ children }: { children: ReactNode }) {
  const documents = await getUserDocuments();

  return (
    <div className="fixed inset-0 flex h-[100dvh] w-full overflow-hidden bg-white dark:bg-zinc-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30 flex-col overflow-hidden">
        <SidebarContent documents={documents} />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Dynamic Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
