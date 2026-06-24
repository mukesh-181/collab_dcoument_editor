import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { searchUsersByEmail } from "@/features/invites/actions/search-users.action"

vi.mock("@/lib/supabase/server")

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("searchUsersByEmail", () => {
  it("returns matching users", async () => {
    const users = [
      { id: "user-1", name: "John", email: "john@test.com", image: null },
      { id: "user-2", name: "Jane", email: "jane@test.com", image: null },
    ]

    mockClient.from().ilike.mockReturnThis()
    mockClient.from().limit.mockReturnThis()
    ;(mockClient.from() as unknown as Record<string, ReturnType<typeof vi.fn>>).limit = vi.fn(() => ({
      data: users,
      error: null,
    }))

    const result = await searchUsersByEmail("john")
    expect(result).toHaveLength(2)
    expect(result[0].email).toBe("john@test.com")
  })

  it("returns empty array when query is too short", async () => {
    const result = await searchUsersByEmail("a")
    expect(result).toEqual([])
  })

  it("returns empty array when query is empty", async () => {
    const result = await searchUsersByEmail("")
    expect(result).toEqual([])
  })

  it("uses ilike for partial email matching", async () => {
    mockClient.from().ilike.mockReturnThis()
    ;(mockClient.from() as unknown as Record<string, ReturnType<typeof vi.fn>>).limit = vi.fn(() => ({
      data: [],
      error: null,
    }))

    await searchUsersByEmail("test")
    expect(mockClient.from().ilike).toHaveBeenCalledWith("email", "%test%")
  })

  it("limits results to 7", async () => {
    mockClient.from().ilike.mockReturnThis()
    ;(mockClient.from() as unknown as Record<string, ReturnType<typeof vi.fn>>).limit = vi.fn(() => ({
      data: [],
      error: null,
    }))

    await searchUsersByEmail("test")
    expect(mockClient.from().limit).toHaveBeenCalledWith(7)
  })
})
