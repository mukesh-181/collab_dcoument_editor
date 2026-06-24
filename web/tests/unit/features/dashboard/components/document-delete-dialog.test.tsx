// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { DocumentDeleteDialog } from "@/features/dashboard/components/dialogs/document-delete-dialog"

const mockDelete = vi.hoisted(() => vi.fn())
vi.mock("@/features/dashboard/actions/delete-document.action", () => ({
  deleteDocument: mockDelete,
}))

const defaultProps = {
  documentId: "doc-1",
  documentTitle: "My Document",
  isOpen: true,
  setIsOpen: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("DocumentDeleteDialog", () => {
  it("renders when open", () => {
    render(<DocumentDeleteDialog {...defaultProps} />)
    const titles = screen.getAllByText("Delete Document")
    expect(titles.length).toBeGreaterThanOrEqual(1)
  })

  it("shows the document title in the confirmation", () => {
    render(<DocumentDeleteDialog {...defaultProps} />)
    const matches = screen.getAllByText(/My Document/)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it("calls deleteDocument and closes on confirm", async () => {
    const setIsOpen = vi.fn()
    mockDelete.mockResolvedValue(undefined)
    render(<DocumentDeleteDialog {...defaultProps} setIsOpen={setIsOpen} />)
    const btns = screen.getAllByRole("button", { name: "Delete Document" })
    fireEvent.click(btns[0])
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("doc-1")
    })
    await waitFor(() => {
      expect(setIsOpen).toHaveBeenCalledWith(false)
    })
  })

  it("calls setIsOpen(false) on Cancel", () => {
    const setIsOpen = vi.fn()
    render(<DocumentDeleteDialog {...defaultProps} setIsOpen={setIsOpen} />)
    const cancelBtns = screen.getAllByRole("button", { name: "Cancel" })
    fireEvent.click(cancelBtns[0])
    expect(setIsOpen).toHaveBeenCalledWith(false)
  })
})
