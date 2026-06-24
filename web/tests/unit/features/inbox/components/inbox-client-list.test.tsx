// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

const mockGetInbox = vi.hoisted(() => vi.fn())
vi.mock("@/features/inbox/actions/get-inbox.action", () => ({
  getInbox: mockGetInbox,
}))

vi.mock("@/features/inbox/components/inbox-item", () => ({
  InboxItem: ({ invite }: { invite: { id: string; status: string } }) => (
    <div data-testid="inbox-item">{invite.id} - {invite.status}</div>
  ),
}))

vi.mock("@/features/inbox/components/inbox-realtime-listener", () => ({
  InboxRealtimeListener: () => null,
}))

import { InboxClientList } from "@/features/inbox/components/inbox-client-list"

const mockInvites = [
  { id: "inv-1", token: "t1", document_id: "doc-1", role: "editor", status: "pending", created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString() },
  { id: "inv-2", token: "t2", document_id: "doc-2", role: "viewer", status: "accepted", created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString() },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe("InboxClientList", () => {
  it("renders inbox title", () => {
    render(<InboxClientList initialInvites={mockInvites} initialCount={2} />)
    expect(screen.getByText("Inbox")).toBeInTheDocument()
  })

  it("shows item count", () => {
    render(<InboxClientList initialInvites={mockInvites} initialCount={2} />)
    expect(screen.getByText("2 items")).toBeInTheDocument()
  })

  it("renders filter options", () => {
    render(<InboxClientList initialInvites={mockInvites} initialCount={2} />)
    expect(screen.getAllByText("All").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Invites").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Documents").length).toBeGreaterThanOrEqual(1)
  })

  it("renders inbox items from initialInvites", () => {
    render(<InboxClientList initialInvites={mockInvites} initialCount={2} />)
    const items = screen.getAllByTestId("inbox-item")
    expect(items.length).toBe(2)
  })

  it("shows empty state when no invites", () => {
    render(<InboxClientList initialInvites={[]} initialCount={0} />)
    expect(screen.getByText(/You're all caught up/)).toBeInTheDocument()
  })

  it("fetches new data when filter button is clicked", async () => {
    mockGetInbox.mockResolvedValue({ data: [], count: 0 })
    render(<InboxClientList initialInvites={mockInvites} initialCount={2} />)
    fireEvent.click(screen.getByText("Invites"))
    await vi.waitFor(() => {
      expect(mockGetInbox).toHaveBeenCalled()
    })
  })
})
