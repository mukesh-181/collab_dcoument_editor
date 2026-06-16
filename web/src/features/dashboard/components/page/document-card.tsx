"use client";

import Link from "next/link";
import { FileText, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DocumentActionMenu } from "../document-action-menu";
import { useDocumentPreview } from "../../hooks/use-document-preview";
import { ROUTES } from "@/constants/routes";
import { getInitials } from "@/utils/string-utils";

// Sub-component for rendering the scaled-down rich text preview
function DocumentPreview({ json }: { json: any }) {
  const html = useDocumentPreview(json);

  // Tiptap often generates <p></p> or <p><br></p> for completely empty documents
  const isVisuallyEmpty = !html || html.trim() === '' || html === '<p></p>' || html === '<p><br></p>';

  if (isVisuallyEmpty) {
    return (
      <div className="flex items-center justify-center h-full">
        <FileText className="w-10 h-10 text-zinc-200 dark:text-zinc-800" strokeWidth={1} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 p-4 overflow-hidden pointer-events-none ">
      <div
        className="prose prose-zinc prose-sm dark:prose-invert max-w-none origin-top-left scale-[0.45]"
        style={{ width: "220%", height: "220%" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

interface DocumentCardProps {
  document: any;
  role: string;
}

function getRoleBadge(role: string) {
  const styles: Record<string, string> = {
    owner: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    editor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    viewer: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  };
  return styles[role] || styles.viewer;
}

export function DocumentCard({ document, role }: DocumentCardProps) {
  const memberCount = document.all_members?.length || 0;

  return (
    <Link
      href={ROUTES.DOCUMENT(document.id)}
      className="group block outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl"
    >
      <div className="relative flex flex-col h-[280px] bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-200 hover:shadow-lg overflow-hidden">

        {/* Preview Area — top portion */}
        <div className="relative flex-1 bg-zinc-50 dark:bg-zinc-950/50 overflow-hidden ">
          <DocumentPreview json={document.previewJson} />
          {/* Fade-out gradient at the bottom of the preview */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-zinc-900/80 to-transparent pointer-events-none" />
          {/* Action menu overlaid on the preview */}
          <div
            className="absolute top-2 right-2 z-10"
            onClick={(e) => e.preventDefault()}
          >
            <DocumentActionMenu
              documentId={document.id}
              documentTitle={document.title}
              role={role}
            />
          </div>
        </div>

        {/* Card Footer */}
        <div className="shrink-0 px-5 py-4 space-y-3 bg-white dark:bg-zinc-900/80">
          {/* Title + Edited */}
          <div>
            <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
              {document.title}
            </h3>
            <span className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-0.5 block">
              Edited{" "}
              {new Date(document.updated_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Bottom row: Avatars + member count + action menu */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {document.all_members && memberCount > 0 && (
                <div className="flex items-center -space-x-1.5">
                  {document.all_members
                    .slice(0, 3)
                    .map((member: any, i: number) => (
                      <Avatar
                        key={member.user.id}
                        className="w-7 h-7 border-2 border-white dark:border-zinc-900 relative shadow-sm"
                        style={{ zIndex: 10 - i }}
                      >
                        <AvatarImage src={member.user.image || undefined} />
                        <AvatarFallback className="text-[10px] bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-semibold">
                          {getInitials(member.user.name, member.user.email)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                </div>
              )}
              {memberCount > 0 && (
                <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-[12px] font-medium">{memberCount}</span>
                </div>
              )}
            </div>

            {/* Role badge */}
            <span
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${getRoleBadge(role)}`}
            >
              {role}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
