"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import {
  Plus,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import type { DashboardDocument } from "../../types";
import { CreateDocumentButton } from "../layout/create-document-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "./document-card";

interface DocumentListProps {
  documents: DashboardDocument[];
  user?: User | null;
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

export function DocumentList({
  documents,
  user,
  totalPages,
  currentPage,
  totalCount,
}: DocumentListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlFilter = searchParams.get("filter") || "all";
  const [localFilter, setLocalFilter] = useState(urlFilter);

  const initialSearch = searchParams.get("search") || "";
  const [localSearch, setLocalSearch] = useState(initialSearch);
  const [debouncedSearch] = useDebounce(localSearch, 900);

  const localFilterRef = useRef(urlFilter);
  useEffect(() => {
    if (localFilterRef.current !== urlFilter) {
      localFilterRef.current = urlFilter;
      setLocalFilter(urlFilter);
    }
  }, [urlFilter]);

  const isLoading = isPending || localSearch !== initialSearch || localFilter !== urlFilter;

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams],
  );

  useEffect(() => {
    // When debounced search changes, update URL and reset page to 1
    if (debouncedSearch !== initialSearch) {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      } else {
        params.delete("search");
      }
      params.set("page", "1");

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, pathname, router]);

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString("page", newPage.toString())}`,
        { scroll: false },
      );
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto relative">
      <div className="relative z-10 px-6 py-8 max-w-6xl mx-auto w-full flex flex-col grow">
        {/* Header Row */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8 shrink-0">
          <div className="space-y-1 shrink-0">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Your documents
            </h1>
            <p className="text-[15px] text-zinc-500 dark:text-zinc-400">
              {totalCount} document{totalCount !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 xl:gap-3 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0">
            {/* Filter Pills */}
            <div className="flex items-center bg-white/80 dark:bg-zinc-900/50 p-1 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm backdrop-blur-md shrink-0">
              {[
                { id: 'all', label: 'All' },
                { id: 'owned-by-me', label: 'Owned' },
                { id: 'owned-by-others', label: 'Shared' },
                { id: 'editor', label: 'Editor' },
                { id: 'viewer', label: 'Viewer' },
              ].map(f => {
                const isActive = localFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setLocalFilter(f.id);
                      startTransition(() => {
                        router.push(`${pathname}?${createQueryString("filter", f.id)}`, { scroll: false });
                      });
                    }}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                      isActive 
                        ? "bg-primary/10 dark:bg-primary/20 text-primary shadow-sm" 
                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="relative w-full sm:w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Search docs"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-9 h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-[14px] rounded-xl focus-visible:ring-purple-500 shadow-sm w-full"
                />
              </div>
              
              <CreateDocumentButton>
                <button className="flex items-center gap-2 h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground text-[14px] font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap">
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  Create
                </button>
              </CreateDocumentButton>
            </div>
          </div>
        </div>

        {/* Document Grid, Empty State or Loading State */}
        <div className="flex-1 relative flex flex-col">
          {!isLoading && documents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                No documents found
              </h3>
              <p className="text-[14px] text-zinc-500 mt-1">
                {localSearch
                  ? "Try a different search term"
                  : "Create your first document to get started"}
              </p>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 content-start transition-opacity duration-200 ${isLoading ? "opacity-40 pointer-events-none" : "opacity-100"}`}
            >
              {documents.map((doc: DashboardDocument) => {
                const role = doc.document_members?.[0]?.role || "viewer";
                return <DocumentCard key={doc.id} document={doc} role={role} currentUser={user} />;
              })}
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && documents.length > 0 && (
          <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800 mt-8 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <span className="text-sm text-zinc-500 font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
