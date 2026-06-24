import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { leaveDocumentAction } from "@/features/document/actions/leave-document.action"

vi.mock("@/lib/supabase/server")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("leaveDocumentAction", () => {
  it("removes current user from document_members", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: { owner_id: "other-user" },
      error: null,
    })

    const result = await leaveDocumentAction("doc-1", "owner@test.com", "John")

    expect(result).toEqual({ success: true })
    expect(mockClient.from().delete).toHaveBeenCalled()
  })

  it("inserts exit notification for the owner", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: { owner_id: "other-user" },
      error: null,
    })

    await leaveDocumentAction("doc-1", "owner@test.com", "John")

    const insertCall = mockClient.from().insert.mock.calls[0]?.[0] as Record<string, unknown>
    expect(insertCall.email).toBe("owner@test.com")
    expect(insertCall.status).toBe("exited")
    expect(insertCall.token).toBe("John")
  })

  it("returns error if user is not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: vi.fn(),
      storage: { from: vi.fn() },
    } as never)

    const result = await leaveDocumentAction("doc-1", "owner@test.com", "John")
    expect(result).toEqual({ error: "Unauthorized" })
  })

  it("returns error if document not found", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: null,
      error: { message: "Not found" },
    })

    const result = await leaveDocumentAction("doc-1", "owner@test.com", "John")
    expect(result).toEqual({ error: "Document not found" })
  })

  it("returns error if current user is the owner", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: { owner_id: "user-1" },
      error: null,
    })

    const result = await leaveDocumentAction("doc-1", "owner@test.com", "John")
    expect(result).toEqual({ error: "The document owner cannot leave the document" })
  })
})
