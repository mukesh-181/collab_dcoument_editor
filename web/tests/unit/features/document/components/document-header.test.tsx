// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { DocumentHeader } from "@/features/document/components/page/document-header"
import { DocumentProvider, useDocumentSync } from "@/features/document/components/page/document-context"
import { useEffect } from "react"

const mockRouterPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: vi.fn() }),
}))

vi.mock("@/features/document/actions/leave-document.action", () => ({
  leaveDocumentAction: vi.fn().mockResolvedValue({ success: true }),
}))

const mockDoc = {
  id: "doc-1",
  title: "Test Document",
  updated_at: "2025-01-01T00:00:00Z",
  all_members: [
    { role: "owner", user: { id: "user-1", name: "Owner", email: "owner@test.com", avatar_url: "" } },
    { role: "editor", user: { id: "user-2", name: "Editor", email: "editor@test.com", avatar_url: "" } },
  ],
}

function RoleSetter({ role }: { role: string }) {
  const { setCurrentUserRole } = useDocumentSync()
  useEffect(() => { setCurrentUserRole(role) }, [role, setCurrentUserRole])
  return null
}

function renderHeader(role = "owner") {
  return render(
    <DocumentProvider initialRole={role}>
      <RoleSetter role={role} />
      <DocumentHeader document={mockDoc} />
    </DocumentProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("DocumentHeader", () => {
  it("renders the document title", () => {
    renderHeader()
    expect(screen.getByText("Test Document")).toBeInTheDocument()
  })

  it("shows back link to dashboard", () => {
    renderHeader()
    const backLinks = screen.getAllByRole("link", { name: /Back to Dashboard/i })
    expect(backLinks.length).toBeGreaterThanOrEqual(1)
  })

  it("shows rename pencil for owner", () => {
    renderHeader("owner")
    const renameBtns = screen.getAllByRole("button", { name: /Rename document/i })
    expect(renameBtns.length).toBeGreaterThanOrEqual(1)
  })

  it("hides rename pencil for viewers", () => {
    renderHeader("viewer")
    const renameBtns = screen.queryAllByRole("button", { name: /Rename document/i })
    expect(renameBtns.length).toBe(0)
  })

  it("shows View Only badge for viewers", () => {
    renderHeader("viewer")
    expect(screen.getByText("View Only")).toBeInTheDocument()
  })

  it("hides View Only badge for owner", () => {
    renderHeader("owner")
    expect(screen.queryByText("View Only")).toBeNull()
  })

  it("shows Invite button for owner", () => {
    renderHeader("owner")
    const inviteBtns = screen.getAllByText("Invite")
    expect(inviteBtns.length).toBeGreaterThanOrEqual(1)
  })

  it("hides Invite button for non-owner", () => {
    renderHeader("editor")
    expect(screen.queryByText("Invite")).toBeNull()
  })

  it("shows Leave button for non-owner", () => {
    renderHeader("editor")
    const leaveBtns = screen.getAllByText("Leave")
    expect(leaveBtns.length).toBeGreaterThanOrEqual(1)
  })

  it("hides Leave button for owner", () => {
    renderHeader("owner")
    expect(screen.queryByText("Leave")).toBeNull()
  })
})
