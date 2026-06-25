"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "use-debounce";
import { extractPageContent, getPageCount } from "@/features/editor/utils/page-extraction";

interface ThumbnailData {
  id: string;
  html: string;
  pageNumber: number;
}

// Pagination configuration matching editor-extensions.ts
const PAGINATION_CONFIG = {
  pageHeight: 1123,
  marginTop: 72,
  marginBottom: 72,
  contentMarginTop: 8,
  contentMarginBottom: 8,
};

export function PageThumbnails() {
  const [isOpen, setIsOpen] = useState(true);
  const [thumbnails, setThumbnails] = useState<ThumbnailData[]>([]);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [rawHtmlTrigger, setRawHtmlTrigger] = useState(0);
  const [debouncedTrigger] = useDebounce(rawHtmlTrigger, 500);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const id = requestAnimationFrame(() => setShowThumbnails(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Setup mutation observer
  useEffect(() => {
    const observeEditor = () => {
      const editorNode = document.querySelector('.ProseMirror');
      if (!editorNode) {
        // If not found yet, try again soon
        setTimeout(observeEditor, 500);
        return;
      }

      const observer = new MutationObserver(() => {
        setRawHtmlTrigger((prev) => prev + 1);
      });

      observer.observe(editorNode, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      });

      // Initial trigger
      setRawHtmlTrigger(1);

      return () => observer.disconnect();
    };

    const cleanup = observeEditor();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  // Process pages when debounced trigger fires
  useEffect(() => {
    if (debouncedTrigger === 0) return;

    const editorNode = document.querySelector(".ProseMirror");
    if (!editorNode) return;

    // Get the actual page count from DOM measurement
    const pageCount = getPageCount();
    if (pageCount === 0) return;

    const newThumbnails: ThumbnailData[] = [];

    // Extract content for each page using DOM measurement
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const html = extractPageContent(pageNum, PAGINATION_CONFIG);

      // Always push the page, even if it's visually blank, to match the main editor's page count
      newThumbnails.push({
        id: `thumb-page-${pageNum}`,
        html: html || '',
        pageNumber: pageNum,
      });
    }

    startTransition(() => setThumbnails(newThumbnails));
  }, [debouncedTrigger]);

  const scrollToPage = (pageNumber: number) => {
    const pageNodes = document.querySelectorAll('.tiptap .page');
    const el = pageNodes[pageNumber - 1] as HTMLElement;
    const container = document.querySelector('main');
    
    if (el && container) {
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const firstPage = document.querySelector('.tiptap .page') as HTMLElement;

      // Get the absolute position of the first page relative to the container's top
      // We add container.scrollTop so this value remains constant regardless of current scroll position
      const firstPageOffset = firstPage 
        ? (firstPage.getBoundingClientRect().top - containerRect.top + container.scrollTop) 
        : 80;
      
      // Calculate scroll position so the target page sits exactly where the first page naturally starts, plus a 16px gap
      const scrollTop = elRect.top - containerRect.top + container.scrollTop - firstPageOffset + 16;
      
      container.scrollTo({ top: scrollTop, behavior: 'smooth' });
    } else if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] z-50 flex">
      {/* Sidebar panel */}
      <div
        className="overflow-hidden transition-[width] duration-300 ease-in-out border-2 border-zinc-200 dark:border-zinc-800 "
        style={{ width: isOpen ? '16rem' : '0' }}
      >
        <div className="w-64 h-full border-r-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 flex flex-col backdrop-blur-sm shadow-xl">
          <div className="h-14 flex items-center justify-between px-4 border-b-2 border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium text-[13px] whitespace-nowrap">
              <FileText className="h-4 w-4 text-zinc-500" />
              Pages ({thumbnails.length})
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-zinc-500 hover:text-zinc-900"
              onClick={() => setIsOpen(false)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 transition-opacity duration-500 ease-in-out"
            style={{ opacity: showThumbnails ? 1 : 0 }}
          >
            {thumbnails.map((thumb) => (
              <div
              key={`thumb-${thumb.pageNumber}`}
                onClick={() => scrollToPage(thumb.pageNumber)}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div
                  className="relative bg-white dark:bg-[#09090b] rounded-md shadow-sm border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden group-hover:ring-2 group-hover:ring-indigo-500/50 transition-all"
                  style={{
                    width: "224px",
                    height: "317px",
                    transformOrigin: "top left",
                  }}
                >
                  <div
                    className="absolute top-0 left-0 pointer-events-none overflow-hidden"
                    style={{
                      width: "794px",
                      height: "1123px",
                      transform: "scale(0.282)",
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
                        className={"prose prose-zinc dark:prose-invert max-w-none bg-transparent leading-[1.2] [&_strong]:text-inherit prose-a:text-blue-600 prose-a:underline dark:prose-a:text-blue-400 prose-p:m-0 prose-p:leading-[1.2] prose-headings:m-0 prose-headings:mb-2 prose-headings:leading-tight prose-ul:my-2 prose-ul:pl-6 prose-ul:list-disc prose-ol:my-2 prose-ol:pl-6 prose-ol:list-decimal prose-li:my-1 prose-li:marker:text-zinc-400 [&_.tableWrapper]:my-4 prose-blockquote:border-l-4 prose-blockquote:border-zinc-300 dark:prose-blockquote:border-zinc-700 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4 prose-q:quotes-['\"'_'\"'] prose-q:italic prose-q:text-zinc-600 dark:prose-q:text-zinc-400 [&_*]:!w-auto [&_*]:!max-w-full [&_*]:!float-none"}
                        style={{
                          width: "666px !important" ,
                          minHeight: "auto",
                          boxSizing: "border-box",
                          wordWrap: "break-word",
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          whiteSpace: "normal",
                          display: "block !important" ,
                        }}
                        dangerouslySetInnerHTML={{ __html: thumb.html }}
                      />
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-zinc-400 group-hover:text-indigo-500 transition-colors">
                  {thumb.pageNumber}
                </span>
              </div>
            ))}
            {thumbnails.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-zinc-400 text-xs">
                Loading pages...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toggle button */}
      <div className="flex items-start pt-4">
        <Button
          variant="ghost"
          size="icon"
          className={`transition-all duration-300 ease-in-out h-8 w-8 rounded-full text-zinc-500 hover:text-zinc-900 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm border border-zinc-200 dark:border-zinc-800 ${isOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100'}`}
          onClick={() => setIsOpen(true)}
          title="Show Pages"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
