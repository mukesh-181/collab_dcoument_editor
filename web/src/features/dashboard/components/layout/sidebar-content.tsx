import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { SidebarDocList } from "./sidebar-doc-list";
import { CreateDocumentButton } from "./create-document-button";

export function SidebarContent({ documents }: { documents: any[] }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image src="/Logo.png" alt="CollabDoc" width={300} height={40} className="h-10 w-auto" style={{ width: "auto" }} priority />
        </Link>
      </div>

      <div className="px-3 pt-4 shrink-0">
        <CreateDocumentButton />
        <div className="h-px bg-zinc-200 dark:bg-zinc-800 mx-1 my-4" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-3">
          Your Documents
        </div>

        <SidebarDocList documents={documents} />
      </div>

      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-zinc-600 dark:text-zinc-400 font-normal h-8"
        >
          <Settings className="mr-2 h-4 w-4 shrink-0 text-zinc-400" />
          Settings
        </Button>
      </div>
    </div>
  );
}
