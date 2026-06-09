'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type SyncState = 'saved' | 'saving' | 'offline'

interface DocumentContextType {
  syncState: SyncState
  setSyncState: (state: SyncState) => void
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined)

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [syncState, setSyncState] = useState<SyncState>('saved')
  return (
    <DocumentContext.Provider value={{ syncState, setSyncState }}>
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocumentSync() {
  const context = useContext(DocumentContext)
  if (!context) throw new Error('useDocumentSync must be used within DocumentProvider')
  return context
}
