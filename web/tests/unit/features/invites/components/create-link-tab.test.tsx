// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CreateLinkTab } from "@/features/invites/components/create-link-tab"

const mockCreateInviteLink = vi.hoisted(() => vi.fn())
vi.mock("@/features/invites/actions/create-invite.action", () => ({
  createInviteLink: mockCreateInviteLink,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("CreateLinkTab", () => {
  it("renders role selector and generate button", () => {
    render(<CreateLinkTab documentId="doc-1" />)
    expect(screen.getByText("Generate Link")).toBeInTheDocument()
    expect(screen.getByText("Viewer")).toBeInTheDocument()
    expect(screen.getByText("Editor")).toBeInTheDocument()
  })

  it("generates a link and shows the result", async () => {
    mockCreateInviteLink.mockResolvedValue("token-123")
    render(<CreateLinkTab documentId="doc-1" />)
    fireEvent.click(screen.getByText("Generate Link"))
    await waitFor(() => {
      expect(mockCreateInviteLink).toHaveBeenCalledWith("doc-1", "viewer")
    })
    const inputs = screen.getAllByDisplayValue(/token-123/)
    expect(inputs.length).toBeGreaterThanOrEqual(1)
  })

  it("shows error when link generation fails", async () => {
    mockCreateInviteLink.mockRejectedValue(new Error("Failed"))
    render(<CreateLinkTab documentId="doc-1" />)
    fireEvent.click(screen.getByText("Generate Link"))
    await waitFor(() => {
      expect(screen.getByText("Failed")).toBeInTheDocument()
    })
  })

  it("toggles between viewer and editor roles", () => {
    render(<CreateLinkTab documentId="doc-1" />)
    fireEvent.click(screen.getByText("Editor"))
    expect(screen.getByText("Editor")).toBeInTheDocument()
  })
})
