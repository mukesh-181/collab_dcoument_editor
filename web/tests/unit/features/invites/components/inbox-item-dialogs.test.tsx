// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { InboxItemDialogs } from "@/features/inbox/components/inbox-item-dialogs"

const defaultProps = {
  isAcceptOpen: false,
  setIsAcceptOpen: vi.fn(),
  isRejectOpen: false,
  setIsRejectOpen: vi.fn(),
  isDeleteOpen: false,
  setIsDeleteOpen: vi.fn(),
  isLoading: false,
  documentTitle: "My Doc",
  role: "editor",
  onAccept: vi.fn(),
  onReject: vi.fn(),
  onDelete: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("InboxItemDialogs", () => {
  it("renders nothing when all closed", () => {
    const { container } = render(<InboxItemDialogs {...defaultProps} />)
    const textNodes = container.querySelectorAll("[data-slot='dialog']")
    expect(textNodes.length).toBe(0)
  })

  it("shows accept dialog", () => {
    render(<InboxItemDialogs {...defaultProps} isAcceptOpen={true} />)
    expect(screen.getAllByText(/Accept Invitation/).length).toBeGreaterThanOrEqual(1)
  })

  it("shows reject dialog", () => {
    render(<InboxItemDialogs {...defaultProps} isRejectOpen={true} />)
    expect(screen.getAllByText(/Reject Invitation/).length).toBeGreaterThanOrEqual(1)
  })

  it("shows delete dialog", () => {
    render(<InboxItemDialogs {...defaultProps} isDeleteOpen={true} />)
    expect(screen.getAllByText(/Delete from Inbox/).length).toBeGreaterThanOrEqual(1)
  })

  it("calls onAccept when accept is clicked", () => {
    const onAccept = vi.fn()
    render(<InboxItemDialogs {...defaultProps} isAcceptOpen={true} onAccept={onAccept} />)
    const acceptBtns = screen.getAllByRole("button", { name: "Accept" })
    fireEvent.click(acceptBtns[0])
    expect(onAccept).toHaveBeenCalled()
  })

  it("disables buttons when loading", () => {
    render(<InboxItemDialogs {...defaultProps} isAcceptOpen={true} isLoading={true} />)
    const acceptBtns = screen.getAllByRole("button", { name: "Accept" })
    expect(acceptBtns[0]).toBeDisabled()
  })
})
