"use client";

import { Plus, Search } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import type { DashboardDocument } from "../../types"
import { CreateDocumentButton } from "../layout/create-document-button"
import { MobileSidebar } from '../layout/mobile-sidebar'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DocumentCard } from './document-card'
import { useFilteredDocuments } from '../../hooks/use-filtered-documents'

export function DocumentList({ documents, user }: { documents: DashboardDocument[], user?: User | null }) {
  const { searchQuery, setSearchQuery, filterType, setFilterType, filteredDocuments } = useFilteredDocuments(documents)

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="px-6 py-6 max-w-5xl mx-auto w-full space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="lg:hidden">
              <MobileSidebar documents={documents} user={user} />
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-[18px] font-semibold text-zinc-800 dark:text-zinc-200">Documents</h2>
              <div className="h-5 w-[1px] bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
              <span className="text-[15px] font-medium text-zinc-500 hidden sm:block">
                {filterType === 'all' ? 'All' : 
                 filterType === 'owned-by-me' ? 'Owned by me' : 
                 filterType === 'owned-by-others' ? 'Owned by others' : 
                 filterType === 'editor' ? 'Editor' : 'Viewer'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[13px] text-zinc-500 font-medium mr-2">
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
            </span>
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-[14px]"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[170px] h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-[14px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="owned-by-me">Owned by me</SelectItem>
                <SelectItem value="owned-by-others">Owned by others</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Create New Document Card */}
          <CreateDocumentButton>
            <div className="group relative flex flex-col h-[240px] bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-sm hover:border-indigo-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all cursor-pointer">
              <div className="flex-1 flex items-center justify-center bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 rounded-t-sm">
                <Plus className="w-12 h-12 text-zinc-800 dark:text-zinc-200" strokeWidth={1} />
              </div>
              <div className="shrink-0 h-[76px] px-3 flex items-center justify-center rounded-b-sm bg-white dark:bg-zinc-950">
                <span className="truncate text-[14px] font-medium text-zinc-800 dark:text-zinc-200">Blank document</span>
              </div>
            </div>
          </CreateDocumentButton>

          {/* Recent Documents */}
          {filteredDocuments.map((doc: any) => {
            const role = doc.document_members?.[0]?.role || 'viewer'
            return <DocumentCard key={doc.id} document={doc} role={role} />
          })}
        </div>
      </div>
    </div>
  )
}
