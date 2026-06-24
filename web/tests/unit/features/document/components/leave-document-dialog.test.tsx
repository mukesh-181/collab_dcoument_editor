// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { LeaveDocumentDialog } from "@/features/document/components/page/leave-document-dialog"

const mockConfirm = vi.fn()

const defaultProps = {
  isOpen: true,
  setIsOpen: vi.fn(),
  documentTitle: "My Document",
  onConfirm: mockConfirm,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("LeaveDocumentDialog", () => {
  it("renders when open", () => {
    render(<LeaveDocumentDialog {...defaultProps} />)
    const titles = screen.getAllByText("Leave Document")
    expect(titles.length).toBeGreaterThanOrEqual(1)
  })

  it("shows the document title", () => {
    render(<LeaveDocumentDialog {...defaultProps} />)
    expect(screen.getAllByText(/My Document/).length).toBeGreaterThanOrEqual(1)
  })

  it("calls onConfirm and closes on confirm", async () => {
    mockConfirm.mockResolvedValue(undefined)
    const setIsOpen = vi.fn()
    render(<LeaveDocumentDialog {...defaultProps} setIsOpen={setIsOpen} />)
    const leaveBtns = screen.getAllByRole("button", { name: "Leave Document" })
    fireEvent.click(leaveBtns[0])
    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(setIsOpen).toHaveBeenCalledWith(false)
    })
  })

  it("calls setIsOpen(false) on Cancel", () => {
    const setIsOpen = vi.fn()
    render(<LeaveDocumentDialog {...defaultProps} setIsOpen={setIsOpen} />)
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[0])
    expect(setIsOpen).toHaveBeenCalledWith(false)
  })

  it("disables buttons while pending", async () => {
    mockConfirm.mockImplementation(() => new Promise((r) => setTimeout(r, 100)))
    render(<LeaveDocumentDialog {...defaultProps} />)
    fireEvent.click(screen.getAllByRole("button", { name: "Leave Document" })[0])
    const leaveBtns = screen.getAllByRole("button", { name: "Leave Document" })
    expect(leaveBtns[0]).toBeDisabled()
    const cancelBtns = screen.getAllByRole("button", { name: "Cancel" })
    expect(cancelBtns[0]).toBeDisabled()
  })
})
