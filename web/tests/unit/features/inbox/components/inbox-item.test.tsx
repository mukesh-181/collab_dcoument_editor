// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { InboxItem } from "@/features/inbox/components/inbox-item"
import type { InboxInvite } from "@/features/inbox/components/inbox-item"

const mockAcceptInvite = vi.hoisted(() => vi.fn())
const mockRejectInvite = vi.hoisted(() => vi.fn())
const mockDeleteInvite = vi.hoisted(() => vi.fn())
vi.mock("@/features/invites/actions/accept-invite.action", () => ({
  acceptInvite: mockAcceptInvite,
}))
vi.mock("@/features/invites/actions/reject-invite.action", () => ({
  rejectInvite: mockRejectInvite,
}))
vi.mock("@/features/invites/actions/delete-invite.action", () => ({
  deleteInvite: mockDeleteInvite,
}))

const mockRouterRefresh = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makePendingInvite(overrides: Partial<InboxInvite> = {}): InboxInvite {
  return {
    id: "inv-1",
    token: "token-abc",
    status: "pending",
    role: "editor",
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
    document_id: "doc-1",
    documents: { title: "My Document", owner: { name: "Inviter", email: "inviter@test.com" } },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("InboxItem", () => {
  it("renders the inviter name", () => {
    render(<InboxItem invite={makePendingInvite()} />)
    expect(screen.getByText("Inviter")).toBeInTheDocument()
  })

  it("shows Accept and Reject buttons for pending invites", () => {
    render(<InboxItem invite={makePendingInvite()} />)
    expect(screen.getAllByText("Accept").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Reject").length).toBeGreaterThanOrEqual(1)
  })

  it("shows Accepted badge for accepted invites", () => {
    render(<InboxItem invite={makePendingInvite({ status: "accepted" })} />)
    expect(screen.getByText("Accepted")).toBeInTheDocument()
  })

  it("shows Rejected badge for rejected invites", () => {
    render(<InboxItem invite={makePendingInvite({ status: "rejected" })} />)
    expect(screen.getByText("Rejected")).toBeInTheDocument()
  })

  it("shows Expired badge for expired pending invites", () => {
    render(<InboxItem invite={makePendingInvite({ expires_at: new Date(Date.now() - 86400000).toISOString() })} />)
    expect(screen.getByText("Expired")).toBeInTheDocument()
  })

  it("shows Go to Document button for accepted invites", () => {
    render(<InboxItem invite={makePendingInvite({ status: "accepted" })} />)
    const goBtns = screen.getAllByRole("button", { name: /Go to Document/i })
    expect(goBtns.length).toBeGreaterThanOrEqual(1)
  })

  it("shows Remove button for expired invites", () => {
    render(<InboxItem invite={makePendingInvite({ expires_at: new Date(Date.now() - 86400000).toISOString() })} />)
    const trashBtns = screen.getAllByRole("button", { name: /Remove from Inbox/i })
    expect(trashBtns.length).toBeGreaterThanOrEqual(1)
  })

  it("calls acceptInvite on accept", async () => {
    mockAcceptInvite.mockResolvedValue(undefined)
    const onItemUpdate = vi.fn()
    render(<InboxItem invite={makePendingInvite()} onItemUpdate={onItemUpdate} />)
    fireEvent.click(screen.getAllByText("Accept")[0])
    const acceptDialogs = screen.getAllByText("Accept Invitation?")
    expect(acceptDialogs.length).toBeGreaterThanOrEqual(1)
    const confirmBtns = screen.getAllByRole("button", { name: "Accept" })
    fireEvent.click(confirmBtns[confirmBtns.length - 1])
    await waitFor(() => {
      expect(mockAcceptInvite).toHaveBeenCalledWith("token-abc")
    })
  })

  it("calls rejectInvite on reject", async () => {
    mockRejectInvite.mockResolvedValue(undefined)
    render(<InboxItem invite={makePendingInvite()} />)
    fireEvent.click(screen.getAllByText("Reject")[0])
    const confirmBtns = screen.getAllByRole("button", { name: "Reject" })
    fireEvent.click(confirmBtns[confirmBtns.length - 1])
    await waitFor(() => {
      expect(mockRejectInvite).toHaveBeenCalledWith("inv-1")
    })
  })

  it("calls deleteInvite on delete", async () => {
    mockDeleteInvite.mockResolvedValue(undefined)
    render(<InboxItem invite={makePendingInvite({ expires_at: new Date(Date.now() - 86400000).toISOString() })} />)
    const trashBtns = screen.getAllByRole("button", { name: /Remove from Inbox/i })
    fireEvent.click(trashBtns[0])
    const confirmBtns = screen.getAllByRole("button", { name: "Delete" })
    fireEvent.click(confirmBtns[confirmBtns.length - 1])
    await waitFor(() => {
      expect(mockDeleteInvite).toHaveBeenCalledWith("inv-1")
    })
  })
})
