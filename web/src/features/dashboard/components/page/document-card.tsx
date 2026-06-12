"use client";

import Link from 'next/link';
import { FileSpreadsheet } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DocumentActionMenu } from "../document-action-menu";
import { useDocumentPreview } from "../../hooks/use-document-preview";

// Sub-component to safely and efficiently render the rich text preview
function DocumentPreview({ json }: { json: any }) {
  const html = useDocumentPreview(json);

  if (!html) return <div className="w-full h-full" />;

  return (
    <div className="absolute inset-0 p-4 pt-5 overflow-hidden pointer-events-none">
      <div 
        className="prose prose-zinc prose-sm dark:prose-invert max-w-none origin-top-left scale-[0.5] sm:scale-[0.55]"
        style={{ width: '200%', height: '200%' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

interface DocumentCardProps {
  document: any;
  role: string;
}

export function DocumentCard({ document, role }: DocumentCardProps) {
  return (
    <div className="group relative flex flex-col h-[240px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm hover:border-indigo-500/50 transition-all hover:shadow-md">
      {/* Thumbnail Preview */}
      <Link href={`/dashboard/${document.id}`} className="flex-1 block rounded-t-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 relative overflow-hidden bg-white dark:bg-zinc-950">
        <DocumentPreview json={document.previewJson} />
        
        {/* Avatars Overlay (Bottom Right) */}
        {document.all_members && document.all_members.length > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center -space-x-1.5 z-10">
            {document.all_members.slice(0, 3).map((member: any, i: number) => (
              <Avatar key={member.user.id} className="w-6 h-6 border-[1.5px] border-white dark:border-zinc-950 relative shadow-sm" style={{ zIndex: 10 - i }}>
                <AvatarImage src={member.user.image || undefined} />
                <AvatarFallback className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                  {(member.user.name || member.user.email || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {document.all_members.length > 3 && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full border-[1.5px] border-white dark:border-zinc-950 bg-zinc-100 dark:bg-zinc-800 text-[9px] font-medium text-zinc-600 dark:text-zinc-300 relative shadow-sm z-0">
                +{document.all_members.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Subtle gradient to fade out text at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent dark:from-zinc-950 pointer-events-none" />
      </Link>

      {/* Card Footer */}
      <div className="shrink-0 h-[76px] px-3 py-2.5 flex flex-col justify-between border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-b-sm">
        <Link href={`/dashboard/${document.id}`} className="truncate text-[14px] font-medium text-zinc-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 block outline-none">
          {document.title}
        </Link>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <FileSpreadsheet className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span className="shrink-0 px-1.5 py-0.5 rounded-[4px] bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 capitalize">
              {role}
            </span>
            <span className="truncate text-[11px] text-zinc-500">
              {new Date(document.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          
          <div className="flex-shrink-0 -mr-2">
            <DocumentActionMenu
              documentId={document.id}
              documentTitle={document.title}
              role={role}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
