import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { removeMemberAction } from "@/features/document/actions/remove-member.action"

vi.mock("@/lib/supabase/server")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("removeMemberAction", () => {
  it("removes member when current user is owner", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: { owner_id: "user-1" },
      error: null,
    })

    const result = await removeMemberAction("doc-1", "member-2", "member@test.com")
    expect(result).toEqual({ success: true })
    expect(mockClient.from().delete).toHaveBeenCalled()
  })

  it("inserts removal notification", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: { owner_id: "user-1" },
      error: null,
    })

    await removeMemberAction("doc-1", "member-2", "member@test.com")

    const insertCall = mockClient.from().insert.mock.calls[0]?.[0] as Record<string, unknown>
    expect(insertCall.email).toBe("member@test.com")
    expect(insertCall.status).toBe("removed")
  })

  it("returns error if user is not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: vi.fn(),
      storage: { from: vi.fn() },
    } as never)

    const result = await removeMemberAction("doc-1", "member-2", "member@test.com")
    expect(result).toEqual({ error: "Unauthorized" })
  })

  it("returns error if current user is not owner", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: { owner_id: "other-user" },
      error: null,
    })

    const result = await removeMemberAction("doc-1", "member-2", "member@test.com")
    expect(result).toEqual({ error: "Only the document owner can remove members" })
  })

  it("returns error if document not found", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const result = await removeMemberAction("doc-1", "member-2", "member@test.com")
    expect(result).toEqual({ error: "Only the document owner can remove members" })
  })
})
