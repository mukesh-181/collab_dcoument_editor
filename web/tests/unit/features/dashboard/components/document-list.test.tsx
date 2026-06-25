// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

const mockPush = vi.hoisted(() => vi.fn())
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(""),
}))

vi.mock("use-debounce", () => ({
  useDebounce: (v: string) => [v, vi.fn()],
}))

vi.mock("@/features/dashboard/components/page/document-card", () => ({
  DocumentCard: ({ document }: { document: { id: string; title: string } }) => (
    <div data-testid="doc-card">{document.title}</div>
  ),
}))

import { DocumentList } from "@/features/dashboard/components/page/document-list"
import type { DashboardDocument } from "@/features/dashboard/types"

const docs: DashboardDocument[] = [
  { id: "doc-1", title: "Doc 1", updated_at: "2025-01-01T00:00:00Z" },
  { id: "doc-2", title: "Doc 2", updated_at: "2025-01-02T00:00:00Z" },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe("DocumentList", () => {
  it("renders the title", () => {
    render(<DocumentList documents={docs} totalPages={1} currentPage={1} totalCount={2} />)
    expect(screen.getByText("Your documents")).toBeInTheDocument()
  })

  it("shows document count", () => {
    render(<DocumentList documents={docs} totalPages={1} currentPage={1} totalCount={2} />)
    expect(screen.getByText("2 documents")).toBeInTheDocument()
  })

  it("renders document cards", () => {
    render(<DocumentList documents={docs} totalPages={1} currentPage={1} totalCount={2} />)
    const cards = screen.getAllByTestId("doc-card")
    expect(cards.length).toBe(2)
  })

  it("shows empty state when no documents", () => {
    render(<DocumentList documents={[]} totalPages={0} currentPage={1} totalCount={0} />)
    expect(screen.getByText("No documents found")).toBeInTheDocument()
  })

  it("shows all filter pills", () => {
    render(<DocumentList documents={docs} totalPages={1} currentPage={1} totalCount={2} />)
    expect(screen.getByText("All")).toBeInTheDocument()
    expect(screen.getByText("Owned")).toBeInTheDocument()
    expect(screen.getByText("Shared")).toBeInTheDocument()
    expect(screen.getByText("Editor")).toBeInTheDocument()
    expect(screen.getByText("Viewer")).toBeInTheDocument()
  })

  it("shows pagination when multiple pages", () => {
    render(<DocumentList documents={docs} totalPages={3} currentPage={1} totalCount={6} />)
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument()
  })

  it("hides pagination when only one page", () => {
    render(<DocumentList documents={docs} totalPages={1} currentPage={1} totalCount={2} />)
    expect(screen.queryByText(/Page/)).toBeNull()
  })
})
