"use client";

import { Plus, Search, FileText } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import type { DashboardDocument } from "../../types"
import { CreateDocumentButton } from "../layout/create-document-button"
import { Input } from '@/components/ui/input'
import { DocumentCard } from './document-card'
import { useFilteredDocuments } from '../../hooks/use-filtered-documents'

export function DocumentList({ documents, user }: { documents: DashboardDocument[], user?: User | null }) {
  const { searchQuery, setSearchQuery, filteredDocuments } = useFilteredDocuments(documents)

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto relative">
      <div className="relative z-10 px-6 py-8 max-w-6xl mx-auto w-full space-y-8">

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          {/* Left: Title + Subtitle */}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Your documents
            </h1>
            <p className="text-[15px] text-zinc-500 dark:text-zinc-400">
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Right: Search + New doc button */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              <Input
                type="text"
                placeholder="Search docs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-[14px] rounded-xl focus-visible:ring-indigo-500 shadow-sm"
              />
            </div>
            <CreateDocumentButton>
              <button className="flex items-center gap-2 h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                New doc
              </button>
            </CreateDocumentButton>
          </div>
        </div>

        {/* Document Grid — 3 columns to match reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map((doc: any) => {
            const role = doc.document_members?.[0]?.role || 'viewer'
            return <DocumentCard key={doc.id} document={doc} role={role} />
          })}
        </div>

        {/* Empty state */}
        {filteredDocuments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No documents found</h3>
            <p className="text-[14px] text-zinc-500 mt-1">
              {searchQuery ? 'Try a different search term' : 'Create your first document to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
