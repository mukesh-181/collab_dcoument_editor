"use client";

import Link from "next/link";
import { FileText, Users } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DocumentActionMenu } from "../document-action-menu";
import { useDocumentPreview } from "../../hooks/use-document-preview";
import { ROUTES } from "@/constants/routes";
import { getInitials } from "@/utils/string-utils";
import { preloadEditor } from "@/features/editor/components/lazy-editor";
import { extractUserInfo } from "@/utils/user-utils";

// A4 page dimensions (px) matching the editor config
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

// Sub-component for rendering the scaled-down rich text preview.
// Uses the same A4-canvas technique as page-thumbnails.tsx:
// renders a full 794×1123 A4 canvas with real page margins, then scales it
// down to fit the card preview area via a measured CSS transform.
function DocumentPreview({ json }: { json: any }) {
  const html = useDocumentPreview(json);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.282); // sensible default until measured

  // Measure container width and recompute scale whenever it changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width && width > 0) {
        setScale(width / A4_WIDTH);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Tiptap often generates <p></p> or <p><br></p> for completely empty documents
  const isVisuallyEmpty =
    !html ||
    html.trim() === "" ||
    html === "<p></p>" ||
    html === "<p><br></p>";

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {isVisuallyEmpty ? (
        <div className="flex items-center justify-center h-full">
          <FileText className="w-10 h-10 text-zinc-200 dark:text-zinc-800" strokeWidth={1} />
        </div>
      ) : (
        // Full A4 page canvas scaled to container width
        <div
          className="absolute top-0 left-0"
          style={{
            width: `${A4_WIDTH}px`,
            height: `${A4_HEIGHT}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {/* Replicates real page margins: 72px top/bottom, 64px left/right */}
          <div
            style={{
              padding: "72px 64px",
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <div
              className="prose prose-zinc dark:prose-invert max-w-none bg-transparent leading-[1.2] [&_strong]:text-inherit prose-a:text-blue-600 prose-a:underline dark:prose-a:text-blue-400 prose-p:m-0 prose-p:leading-[1.2] prose-headings:m-0 prose-headings:mb-2 prose-headings:leading-tight prose-ul:my-2 prose-ul:pl-6 prose-ul:list-disc prose-ol:my-2 prose-ol:pl-6 prose-ol:list-decimal prose-li:my-1 prose-li:marker:text-zinc-400 [&_.tableWrapper]:my-4"
              style={{
                wordWrap: "break-word",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                whiteSpace: "normal",
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface DocumentCardProps {
  document: any;
  role: string;
  currentUser?: any;
}

function getRoleBadge(role: string) {
  const styles: Record<string, string> = {
    owner: "bg-purple-400/15 text-purple-500 border-purple-500/30",
    editor: "bg-blue-400/15 text-blue-500 border-blue-500/30",
    viewer: "bg-gray-400/15 text-gray-500 border-gray-500/30",
  };
  return styles[role] || styles.viewer;
}

export function DocumentCard({ document, role, currentUser }: DocumentCardProps) {
  const memberCount = document.all_members?.length || 0;
  const ownerMember = document.all_members?.find((m: any) => m.role === "owner");
  const ownerEmail = ownerMember?.user?.email || "";
  const currentUserName = currentUser?.user_metadata?.full_name || currentUser?.email || "Unknown User";

  // Sort members so the current user is always first (on top of the avatar stack)
  const sortedMembers = document.all_members 
    ? [...document.all_members].sort((a: any, b: any) => {
        if (a.user.id === currentUser?.id) return -1;
        if (b.user.id === currentUser?.id) return 1;
        return 0;
      })
    : [];

  return (
    <Link
      href={ROUTES.DOCUMENT(document.id)}
      onMouseEnter={preloadEditor}
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
              ownerEmail={ownerEmail}
              currentUserName={currentUserName}
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
                  {sortedMembers
                    .slice(0, 3)
                    .map((member: any, i: number) => {
                      const { name, image, email } = extractUserInfo(member.user);
                      return (
                      <Avatar
                        key={member.user.id}
                        className="w-7 h-7 border-2 border-white dark:border-zinc-900 relative shadow-sm"
                        style={{ zIndex: 10 - i }}
                      >
                        <AvatarImage src={image} />
                        <AvatarFallback className="text-[10px] bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-semibold">
                          {getInitials(name, email)}
                        </AvatarFallback>
                      </Avatar>
                    )})}
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
