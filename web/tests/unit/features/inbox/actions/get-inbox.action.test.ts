import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { getInbox } from "@/features/inbox/actions/get-inbox.action"

vi.mock("@/lib/supabase/server")

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("getInbox", () => {
  it("returns paginated invites for the user", async () => {
    const invites = [
      {
        id: "inv-1",
        token: "tok-1",
        document_id: "doc-1",
        role: "editor",
        status: "pending",
        created_at: "2024-01-01",
        expires_at: "2099-01-01",
        documents: { title: "Doc 1", owner: { name: "Alice" } },
      },
    ]

    mockClient.from().select.mockReturnThis()
    mockClient.from().eq.mockReturnThis()
    mockClient.from().order.mockReturnThis()
    mockClient.from().range.mockReturnThis()
    ;(mockClient.from() as unknown as Record<string, ReturnType<typeof vi.fn>>).range = vi.fn(() => ({
      data: invites,
      error: null,
      count: 1,
    }))

    const result = await getInbox(0, 15, "all")
    expect(result.data).toHaveLength(1)
    expect(result.count).toBe(1)
  })

  it("returns empty when user is not authenticated", async () => {
    mockClient = createMockClient({ user: null })
    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const result = await getInbox()
    expect(result).toEqual({ data: [], count: 0 })
  })

  it("returns empty on database error", async () => {
    mockClient.from().select.mockReturnThis()
    mockClient.from().eq.mockReturnThis()
    mockClient.from().order.mockReturnThis()
    mockClient.from().range.mockReturnThis()
    ;(mockClient.from() as unknown as Record<string, ReturnType<typeof vi.fn>>).range = vi.fn(() => ({
      data: null,
      error: { message: "DB error" },
      count: 0,
    }))

    const result = await getInbox()
    expect(result).toEqual({ data: [], count: 0 })
  })

  it("filters by invites status when filter is 'invites'", async () => {
    mockClient.from().select.mockReturnThis()
    mockClient.from().eq.mockReturnThis()
    mockClient.from().in.mockReturnThis()
    mockClient.from().order.mockReturnThis()
    mockClient.from().range.mockReturnThis()
    ;(mockClient.from() as unknown as Record<string, ReturnType<typeof vi.fn>>).range = vi.fn(() => ({
      data: [],
      error: null,
      count: 0,
    }))

    await getInbox(0, 15, "invites")
    expect(mockClient.from().in).toHaveBeenCalledWith("status", ["pending", "accepted", "rejected", "expired"])
  })

  it("filters by document notifications when filter is 'document'", async () => {
    mockClient.from().select.mockReturnThis()
    mockClient.from().eq.mockReturnThis()
    mockClient.from().in.mockReturnThis()
    mockClient.from().order.mockReturnThis()
    mockClient.from().range.mockReturnThis()
    ;(mockClient.from() as unknown as Record<string, ReturnType<typeof vi.fn>>).range = vi.fn(() => ({
      data: [],
      error: null,
      count: 0,
    }))

    await getInbox(0, 15, "document")
    expect(mockClient.from().in).toHaveBeenCalledWith("status", ["role_updated", "removed", "exited"])
  })
})
