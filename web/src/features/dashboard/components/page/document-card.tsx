"use client";

import Link from "next/link";
import { FileText, Users } from "lucide-react";
import { useRef, useState, useEffect, useSyncExternalStore } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DocumentActionMenu } from "../document-action-menu";
import { useDocumentPreview } from "../../hooks/use-document-preview";
import { ROUTES } from "@/constants/routes";
import { getInitials } from "@/utils/string-utils";
import { preloadEditor } from "@/features/editor/components/lazy-editor";
import { extractUserInfo } from "@/utils/user-utils";
import type { User } from "@supabase/supabase-js";

interface DocMember {
  role: string;
  user: {
    id: string;
    name: string;
    image: string;
    email: string;
  };
}

interface DocData {
  id: string;
  title: string;
  updated_at: string;
  previewJson?: Record<string, unknown> | null;
  all_members?: DocMember[];
  document_members?: Array<{ role?: string | null }> | null;
}

// A4 page dimensions (px) matching the editor config
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

function DocumentPreview({ json }: { json: Record<string, unknown> | null | undefined }) {
  const html = useDocumentPreview(json);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.282);
  const [showPreview, setShowPreview] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    if (!mounted) return;
    const id = requestAnimationFrame(() => setShowPreview(true));
    return () => cancelAnimationFrame(id);
  }, [mounted]);

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

  const isVisuallyEmpty =
    !html ||
    html.trim() === "" ||
    html === "<p></p>" ||
    html === "<p><br></p>";

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Placeholder — visible until preview fades in */}
      {(!showPreview || isVisuallyEmpty) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <FileText className="w-10 h-10 text-zinc-200 dark:text-zinc-800" strokeWidth={1} />
        </div>
      )}
      {/* Preview — fades in smoothly on mount */}
      {mounted && !isVisuallyEmpty && (
        <div
          className="absolute top-0 left-0 transition-opacity duration-500 ease-in-out"
          style={{
            opacity: showPreview ? 1 : 0,
            width: `${A4_WIDTH}px`,
            height: `${A4_HEIGHT}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
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
  document: DocData;
  role: string;
  currentUser?: User | null;
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
  const ownerMember = document.all_members?.find((m) => m.role === "owner");
  const ownerEmail = ownerMember?.user?.email || "";
  const { name: currentUserName } = extractUserInfo(currentUser);

  const sortedMembers = document.all_members 
    ? [...document.all_members].sort((a, b) => {
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
      <div className="relative flex flex-col h-[280px] bg-white dark:bg-zinc-900/80 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-200 hover:shadow-lg overflow-hidden">

        {/* Preview Area — top portion */}
        <div className="relative flex-1 bg-zinc-50 dark:bg-zinc-950/50 overflow-hidden border-b-2 border-zinc-200 dark:border-zinc-800">
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
        <div className="shrink-0 px-4 py-3 bg-white dark:bg-zinc-900/80 flex justify-between items-center gap-3">
          
          {/* Left side: Title and Edited Date */}
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="text-[14.5px] font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
              {document.title}
            </h3>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              Edited{" "}
              {new Date(document.updated_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Right side: Avatars and Role Badge */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-2">
              {document.all_members && memberCount > 0 && (
                <div className="flex items-center -space-x-1.5">
                  {sortedMembers
                    .slice(0, 3)
                    .map((member: DocMember, i: number) => {
                      const { name, image, email } = extractUserInfo(member.user);
                      return (
                      <Avatar
                        key={member.user.id}
                        className="w-6 h-6 border-2 border-white dark:border-zinc-900 relative shadow-sm"
                        style={{ zIndex: 10 - i }}
                      >
                        <AvatarImage src={image} />
                        <AvatarFallback className="text-[9px] bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-semibold">
                          {getInitials(name, email)}
                        </AvatarFallback>
                      </Avatar>
                    )})}
                </div>
              )}
              {memberCount > 0 && (
                <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                  <Users className="w-3 h-3" />
                  <span className="text-[11px] font-medium">{memberCount}</span>
                </div>
              )}
            </div>

            {/* Role badge */}
            <span
              className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-2 ${getRoleBadge(role)}`}
            >
              {role}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
