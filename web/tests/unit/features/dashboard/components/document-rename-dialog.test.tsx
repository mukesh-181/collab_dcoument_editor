// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { DocumentRenameDialog } from "@/features/dashboard/components/dialogs/document-rename-dialog"

const mockUpdateTitle = vi.hoisted(() => vi.fn())
vi.mock("@/features/dashboard/actions/update-document-title.action", () => ({
  updateDocumentTitle: mockUpdateTitle,
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
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

describe("DocumentRenameDialog", () => {
  it("renders when open", () => {
    render(<DocumentRenameDialog {...defaultProps} />)
    expect(screen.getByText("Rename Document")).toBeInTheDocument()
  })

  it("shows the current title in the input", () => {
    render(<DocumentRenameDialog {...defaultProps} />)
    const inputs = screen.getAllByDisplayValue("My Document")
    expect(inputs.length).toBeGreaterThanOrEqual(1)
    expect(inputs[0]).toHaveValue("My Document")
  })

  it("calls updateDocumentTitle on submit with new title", () => {
    render(<DocumentRenameDialog {...defaultProps} />)
    const inputs = screen.getAllByDisplayValue("My Document")
    const input = inputs[0]
    fireEvent.change(input, { target: { value: "New Title" } })
    const form = input.closest("form")!
    fireEvent.submit(form)
    expect(mockUpdateTitle).toHaveBeenCalledWith("doc-1", "New Title")
  })

  it("disables Save button when title is unchanged", () => {
    render(<DocumentRenameDialog {...defaultProps} />)
    const saveBtns = screen.getAllByRole("button", { name: "Save" })
    expect(saveBtns[0]).toBeDisabled()
  })

  it("calls setIsOpen(false) on Cancel", () => {
    const setIsOpen = vi.fn()
    render(<DocumentRenameDialog {...defaultProps} setIsOpen={setIsOpen} />)
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(setIsOpen).toHaveBeenCalledWith(false)
  })
})
