// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { RemoveMemberDialog } from "@/features/document/components/page/remove-member-dialog"

const mockConfirm = vi.fn()

const defaultProps = {
  isOpen: true,
  setIsOpen: vi.fn(),
  memberName: "John Doe",
  onConfirm: mockConfirm,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("RemoveMemberDialog", () => {
  it("renders when open", () => {
    render(<RemoveMemberDialog {...defaultProps} />)
    const titles = screen.getAllByText("Remove Member")
    expect(titles.length).toBeGreaterThanOrEqual(1)
  })

  it("shows the member name", () => {
    render(<RemoveMemberDialog {...defaultProps} />)
    expect(screen.getAllByText(/John Doe/).length).toBeGreaterThanOrEqual(1)
  })

  it("calls onConfirm and closes on confirm", async () => {
    mockConfirm.mockResolvedValue(undefined)
    const setIsOpen = vi.fn()
    render(<RemoveMemberDialog {...defaultProps} setIsOpen={setIsOpen} />)
    fireEvent.click(screen.getAllByRole("button", { name: "Remove Member" })[0])
    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(setIsOpen).toHaveBeenCalledWith(false)
    })
  })

  it("calls setIsOpen(false) on Cancel", () => {
    const setIsOpen = vi.fn()
    render(<RemoveMemberDialog {...defaultProps} setIsOpen={setIsOpen} />)
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[0])
    expect(setIsOpen).toHaveBeenCalledWith(false)
  })
})
