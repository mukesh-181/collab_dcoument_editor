import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { getUserDocuments } from "@/features/dashboard/actions/get-user-documents.action"

vi.mock("@/lib/supabase/server")

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("getUserDocuments action", () => {
  it("returns empty result when user is not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn(() => ({
              ilike: vi.fn(() => ({
                order: vi.fn(() => ({
                  range: vi.fn(() => ({ data: [], error: null, count: 0 })),
                  limit: vi.fn(() => ({ data: [], error: null, count: 0 })),
                })),
              })),
            })),
          })),
        })),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })),
    } as never)

    const result = await getUserDocuments()
    expect(result).toEqual({ documents: [], totalCount: 0, totalPages: 0 })
  })

  it("returns processed documents with pagination", async () => {
    const docs = [
      { id: "doc-1", title: "Doc 1", updated_at: "2024-01-01", document_members: [{ role: "owner", user_id: "user-1" }], document_content_state: null },
      { id: "doc-2", title: "Doc 2", updated_at: "2024-01-02", document_members: [{ role: "editor", user_id: "user-1" }], document_content_state: null },
    ]

    mockClient.from().select.mockReturnThis()
    mockClient.from().eq.mockReturnThis()
    mockClient.from().neq.mockReturnThis()
    mockClient.from().ilike.mockReturnThis()
    mockClient.from().order.mockReturnThis()
    mockClient.from().range.mockReturnThis()
    mockClient.from().single.mockReturnThis()

    const mockResponse = { data: docs, error: null, count: 2 }
    ;(mockClient.from() as unknown as Record<string, ReturnType<typeof vi.fn>>).range = vi.fn(() => mockResponse)

    const result = await getUserDocuments({ page: 1, limit: 6 })
    expect(result.totalCount).toBe(2)
    expect(result.totalPages).toBe(1)
    expect(result.documents).toHaveLength(2)
    expect(result.documents[0].id).toBe("doc-1")
    expect(result.documents[0].document_content_state).toBeUndefined()
  })

  it("applies search filter when provided", async () => {
    mockClient.from().select.mockReturnThis()
    mockClient.from().eq.mockReturnThis()
    mockClient.from().ilike.mockReturnThis()
    mockClient.from().order.mockReturnThis()
    mockClient.from().single.mockReturnThis()
    ;(mockClient.from() as unknown as Record<string, ReturnType<typeof vi.fn>>).range = vi.fn(() => ({ data: [], error: null, count: 0 }))

    await getUserDocuments({ search: "test", page: 1, limit: 6 })
    expect(mockClient.from().ilike).toHaveBeenCalledWith("title", "%test%")
  })

  it("applies owned-by-me filter", async () => {
    mockClient.from().select.mockReturnThis()
    mockClient.from().eq.mockReturnThis()
    mockClient.from().ilike.mockReturnThis()
    mockClient.from().order.mockReturnThis()
    mockClient.from().single.mockReturnThis()
    ;(mockClient.from() as unknown as Record<string, ReturnType<typeof vi.fn>>).range = vi.fn(() => ({ data: [], error: null, count: 0 }))

    await getUserDocuments({ filter: "owned-by-me" })
    expect(mockClient.from().eq).toHaveBeenCalledWith("document_members.role", "owner")
  })

  it("returns empty on error", async () => {
    mockClient.from().select.mockReturnThis()
    mockClient.from().eq.mockReturnThis()
    mockClient.from().order.mockReturnThis()
    mockClient.from().single.mockReturnThis()
    ;(mockClient.from() as unknown as Record<string, ReturnType<typeof vi.fn>>).range = vi.fn(() => ({ data: null, error: { message: "DB error" }, count: 0 }))

    const result = await getUserDocuments()
    expect(result).toEqual({ documents: [], totalCount: 0, totalPages: 0 })
  })
})
