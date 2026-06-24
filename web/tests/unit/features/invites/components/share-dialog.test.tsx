// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@/features/document/components/page/document-context", () => ({
  useDocumentSync: () => ({ syncState: "saved" }),
}))

import { ShareDialog } from "@/features/invites/components/share-dialog"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ShareDialog", () => {
  it("renders Invite trigger button", () => {
    render(<ShareDialog documentId="doc-1" />)
    const triggers = screen.getAllByText("Invite")
    expect(triggers.length).toBeGreaterThanOrEqual(1)
  })
})
