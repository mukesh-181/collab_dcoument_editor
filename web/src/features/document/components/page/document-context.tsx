'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type SyncState = 'saved' | 'saving' | 'offline'

export interface ActiveUser {
  clientId: number
  user: {
    name: string
    color: string
    image?: string
  }
}

interface DocumentContextType {
  syncState: SyncState
  setSyncState: (state: SyncState) => void
  activeUsers: ActiveUser[]
  setActiveUsers: (users: ActiveUser[]) => void
  isEditorReady: boolean
  setIsEditorReady: (ready: boolean) => void
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined)

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [syncState, setSyncState] = useState<SyncState>('saved')
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [isEditorReady, setIsEditorReady] = useState(false)
  
  return (
    <DocumentContext.Provider value={{ syncState, setSyncState, activeUsers, setActiveUsers, isEditorReady, setIsEditorReady }}>
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocumentSync() {
  const context = useContext(DocumentContext)
  if (!context) throw new Error('useDocumentSync must be used within DocumentProvider')
  return context
}
