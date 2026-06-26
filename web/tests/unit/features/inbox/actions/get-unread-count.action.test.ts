import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { getUnreadCount } from "@/features/inbox/actions/get-unread-count.action"

vi.mock("@/lib/supabase/server")

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("getUnreadCount", () => {
  it("returns count of pending invites for the user", async () => {
    mockClient.from().select.mockReturnThis()
    mockClient.from().eq.mockReturnThis()
    mockClient.from().gt.mockReturnThis()
    ;(mockClient.from() as unknown as Record<string, ReturnType<typeof vi.fn>>).gt = vi.fn(() => ({
      count: 3,
      error: null,
    }))

    const count = await getUnreadCount()
    expect(count).toBe(3)
  })

  it("returns 0 when user is not authenticated", async () => {
    mockClient = createMockClient({ user: null })
    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const count = await getUnreadCount()
    expect(count).toBe(0)
  })

  it("returns 0 on database error", async () => {
    mockClient.from().select.mockReturnThis()
    mockClient.from().eq.mockReturnThis()
    mockClient.from().gt.mockReturnThis()
    ;(mockClient.from() as unknown as Record<string, ReturnType<typeof vi.fn>>).gt = vi.fn(() => ({
      count: undefined,
      error: { message: "DB error" },
    }))

    const count = await getUnreadCount()
    expect(count).toBe(0)
  })
})
