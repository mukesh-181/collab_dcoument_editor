import { WifiOff } from "lucide-react";
import { useDocumentSync } from "@/features/document/components/page/document-context";

export function OfflineBanner() {
  const { syncState } = useDocumentSync();

  if (syncState !== "offline") return null;

  return (
    <div className="bg-amber-100 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-2 flex items-center justify-center text-xs font-medium w-full z-50">
      <WifiOff className="w-4 h-4 mr-2" />
      <span>
        You are offline. Reconnecting... (You can continue editing, changes will sync when reconnected)
      </span>
    </div>
  );
}
