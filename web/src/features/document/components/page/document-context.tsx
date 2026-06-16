'use client'

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react'

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
  setActiveUsers: Dispatch<SetStateAction<ActiveUser[]>>
  isEditorReady: boolean
  setIsEditorReady: (ready: boolean) => void
  currentUserRole: string
  setCurrentUserRole: (role: string) => void
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined)

export function DocumentProvider({ children, initialRole = 'viewer' }: { children: ReactNode, initialRole?: string }) {
  const [syncState, setSyncState] = useState<SyncState>('saved')
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState(initialRole)
  
  return (
    <DocumentContext.Provider value={{ syncState, setSyncState, activeUsers, setActiveUsers, isEditorReady, setIsEditorReady, currentUserRole, setCurrentUserRole }}>
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocumentSync() {
  const context = useContext(DocumentContext)
  if (!context) throw new Error('useDocumentSync must be used within DocumentProvider')
  return context
}
