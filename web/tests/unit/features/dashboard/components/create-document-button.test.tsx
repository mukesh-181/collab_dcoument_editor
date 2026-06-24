// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CreateDocumentButton } from "@/features/dashboard/components/layout/create-document-button"

const mockCreateDoc = vi.hoisted(() => vi.fn())
const mockPush = vi.hoisted(() => vi.fn())
vi.mock("@/features/dashboard/actions/create-document.action", () => ({
  createDocument: mockCreateDoc,
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("CreateDocumentButton", () => {
  it("renders the trigger button", () => {
    render(<CreateDocumentButton />)
    const triggers = screen.getAllByText("New Document")
    expect(triggers.length).toBeGreaterThanOrEqual(1)
  })

  it("opens dialog on trigger click", async () => {
    render(<CreateDocumentButton />)
    const triggers = screen.getAllByText("New Document")
    fireEvent.click(triggers[0])
    const titles = screen.getAllByText("Create a new document")
    expect(titles.length).toBeGreaterThanOrEqual(1)
  })

  it("calls createDocument and navigates on submit", async () => {
    mockCreateDoc.mockResolvedValue("new-doc-id")
    render(<CreateDocumentButton />)
    const triggers = screen.getAllByText("New Document")
    fireEvent.click(triggers[0])

    const inputs = screen.getAllByPlaceholderText("Untitled")
    fireEvent.change(inputs[0], { target: { value: "My Doc" } })
    const createBtns = screen.getAllByText("Create document")
    fireEvent.click(createBtns[0])

    await waitFor(() => {
      expect(mockCreateDoc).toHaveBeenCalled()
    })
    expect(mockPush).toHaveBeenCalledWith("/dashboard/new-doc-id")
  })

  it("has a working Cancel button", () => {
    render(<CreateDocumentButton />)
    const triggers = screen.getAllByText("New Document")
    fireEvent.click(triggers[0])
    const cancelBtns = screen.getAllByText("Cancel")
    expect(cancelBtns.length).toBeGreaterThanOrEqual(1)
  })
})
