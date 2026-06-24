// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(""),
}))

import { DocumentCard } from "@/features/dashboard/components/page/document-card"

vi.mock("@/features/dashboard/hooks/use-document-preview", () => ({
  useDocumentPreview: () => "<p>Hello</p>",
}))

vi.mock("@/features/editor/components/lazy-editor", () => ({
  preloadEditor: vi.fn(),
}))

const mockDoc = {
  id: "doc-1",
  title: "📝 My Document",
  updated_at: "2025-01-15T10:30:00Z",
  previewJson: { type: "doc", content: [] },
  all_members: [
    { role: "owner", user: { id: "u1", name: "Alice", email: "alice@test.com", image: "" } },
    { role: "editor", user: { id: "u2", name: "Bob", email: "bob@test.com", image: "" } },
  ],
  document_members: [{ role: "owner" }],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("DocumentCard", () => {
  it("renders document title", () => {
    render(<DocumentCard document={mockDoc} role="owner" />)
    expect(screen.getByText("📝 My Document")).toBeInTheDocument()
  })

  it("renders role badge", () => {
    render(<DocumentCard document={mockDoc} role="owner" />)
    expect(screen.getByText("owner")).toBeInTheDocument()
  })

  it("shows member avatars", () => {
    render(<DocumentCard document={mockDoc} role="owner" />)
    expect(screen.getByText("A")).toBeInTheDocument()
    expect(screen.getByText("B")).toBeInTheDocument()
  })

  it("shows member count", () => {
    render(<DocumentCard document={mockDoc} role="owner" />)
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("shows date", () => {
    render(<DocumentCard document={mockDoc} role="owner" />)
    expect(screen.getByText(/Edited/)).toBeInTheDocument()
  })

  it("renders link to document", () => {
    render(<DocumentCard document={mockDoc} role="owner" />)
    const links = screen.getAllByRole("link")
    const docLink = links.find((l) => l.getAttribute("href")?.includes("doc-1"))
    expect(docLink).toBeTruthy()
  })
})
