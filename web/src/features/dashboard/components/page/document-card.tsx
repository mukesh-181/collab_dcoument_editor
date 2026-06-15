"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DocumentActionMenu } from "../document-action-menu";
import { useDocumentPreview } from "../../hooks/use-document-preview";
import { ROUTES } from "@/constants/routes";
import { getInitials } from "@/utils/string-utils";

// Sub-component to safely and efficiently render the rich text preview
function DocumentPreview({ json }: { json: any }) {
  const html = useDocumentPreview(json);

  if (!html) return <div className="w-full h-full" />;

  return (
    <div className="absolute inset-0 p-4 pt-5 overflow-hidden pointer-events-none">
      <div
        className="prose prose-zinc prose-sm dark:prose-invert max-w-none origin-top-left scale-[0.5] sm:scale-[0.55]"
        style={{ width: "200%", height: "200%" }}
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
    <div className="group relative flex flex-col h-[240px] bg-gradient-to-b from-white/80 to-indigo-50/60 dark:from-zinc-950/80 dark:to-indigo-950/40 backdrop-blur-md border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl hover:border-indigo-500/30 transition-all duration-300 ease-out shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] dark:opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
      {/* Thumbnail Preview */}
      <Link
        href={ROUTES.DOCUMENT(document.id)}
        className="flex-1 block rounded-t-2xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 relative overflow-hidden bg-gradient-to-br from-indigo-50/40 to-purple-50/30 dark:from-indigo-900/10 dark:to-purple-900/10"
      >
        <DocumentPreview json={document.previewJson} />

        {/* Subtle gradient to fade out text at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent dark:from-zinc-950 pointer-events-none" />
      </Link>

      {/* Card Footer */}
      <div className="shrink-0 h-[84px] px-3 py-2.5 flex flex-col justify-between border-t border-zinc-200/60 dark:border-zinc-800/60 bg-transparent rounded-b-2xl">
        <div>
          <Link
            href={ROUTES.DOCUMENT(document.id)}
            className="truncate text-[14px] font-medium text-zinc-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 block outline-none leading-tight"
          >
            {document.title}
          </Link>
          <span className="truncate text-[11px] text-zinc-500 block mt-0.5">
            Edited {new Date(document.updated_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <FileText className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span className="shrink-0 px-1.5 py-0.5 rounded-[4px] bg-indigo-50 dark:bg-indigo-500/10 text-[9px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              {role}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {document.all_members && document.all_members.length > 0 && (
              <div className="hidden sm:flex items-center -space-x-1.5 z-10">
                {document.all_members.slice(0, 3).map((member: any, i: number) => (
                  <Avatar
                    key={member.user.id}
                    className="w-5 h-5 border-2 border-white dark:border-zinc-900 relative shadow-md"
                    style={{ zIndex: 10 - i }}
                  >
                    <AvatarImage src={member.user.image || undefined} />
                    <AvatarFallback className="text-[8px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                      {getInitials(member.user.name, member.user.email)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
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
    </div>
  );
}
