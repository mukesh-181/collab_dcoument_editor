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
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto relative">
      <div className="relative z-10 px-6 py-6 max-w-5xl mx-auto w-full space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="lg:hidden">
              <MobileSidebar documents={documents} user={user} />
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500">Documents</h2>
              <div className="h-6 w-[1.5px] rounded-full bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
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
                className="pl-9 h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-[14px] rounded-full focus-visible:ring-indigo-500 shadow-sm transition-all"
              />
            </div>
            <div className="hidden md:flex items-center bg-white/80 dark:bg-zinc-900/50 p-1 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm backdrop-blur-md">
              {[
                { id: 'all', label: 'All' },
                { id: 'owned-by-me', label: 'Owned' },
                { id: 'owned-by-others', label: 'Shared' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                    filterType === f.id 
                      ? "bg-primary/10 dark:bg-primary/20 text-primary shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="md:hidden">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px] h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-[14px] rounded-full focus:ring-indigo-500 shadow-sm transition-all">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="owned-by-me">Owned</SelectItem>
                  <SelectItem value="owned-by-others">Shared</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Create New Document Card */}
          <CreateDocumentButton>
            <div className="group relative flex flex-col h-[240px] bg-gradient-to-b from-white/80 to-indigo-50/60 dark:from-zinc-950/80 dark:to-indigo-950/40 backdrop-blur-md border-2 border-dashed border-indigo-200/60 dark:border-indigo-800/60 rounded-2xl hover:border-indigo-500/80 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 hover:shadow-lg transition-all duration-300 ease-out cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] dark:opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
              <div className="flex-1 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-900 shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:border-indigo-500/50 transition-all duration-300">
                  <Plus className="w-6 h-6 text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors" strokeWidth={2} />
                </div>
              </div>
              <div className="shrink-0 h-[76px] px-3 flex items-center justify-center pb-2">
                <span className="truncate text-[14px] font-medium text-indigo-700/80 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">Blank document</span>
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
