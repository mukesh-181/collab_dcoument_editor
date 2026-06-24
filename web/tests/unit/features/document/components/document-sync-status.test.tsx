// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { DocumentSyncStatus } from "@/features/document/components/page/document-sync-status"
import { DocumentProvider, useDocumentSync } from "@/features/document/components/page/document-context"
import { useEffect } from "react"
import type { SyncState } from "@/features/document/components/page/document-context"

function SyncStateSetter({ syncState }: { syncState: SyncState }) {
  const { setSyncState } = useDocumentSync()
  useEffect(() => { setSyncState(syncState) }, [syncState, setSyncState])
  return null
}

function renderWithSync(syncState: SyncState) {
  return render(
    <DocumentProvider>
      <SyncStateSetter syncState={syncState} />
      <DocumentSyncStatus />
    </DocumentProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("DocumentSyncStatus", () => {
  it("shows Saving when syncState is saving", () => {
    renderWithSync("saving" as SyncState)
    expect(screen.getByText("Saving...")).toBeInTheDocument()
  })

  it("shows Saved when syncState is saved", () => {
    renderWithSync("saved" as SyncState)
    expect(screen.getByText("Saved")).toBeInTheDocument()
  })

  it("shows Offline when syncState is offline", () => {
    renderWithSync("offline" as SyncState)
    expect(screen.getByText("Offline")).toBeInTheDocument()
  })
})
