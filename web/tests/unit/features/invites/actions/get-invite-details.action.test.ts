import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { getInviteDetails } from "@/features/invites/actions/get-invite-details.action"

vi.mock("@/lib/supabase/server")

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

function makeInviteData(overrides: Record<string, unknown> = {}) {
  return {
    id: "invite-1",
    status: "pending",
    role: "editor",
    document_id: "doc-1",
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    documents: {
      title: "Invited Document",
      owner: { name: "Alice", email: "alice@test.com", image: null },
    },
    ...overrides,
  }
}

describe("getInviteDetails", () => {
  it("returns invite details for valid token", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: makeInviteData(),
      error: null,
    })

    const result = await getInviteDetails("valid-token")
    expect(result.documentTitle).toBe("Invited Document")
    expect(result.ownerName).toBe("Alice")
    expect(result.role).toBe("editor")
    expect(result.documentId).toBe("doc-1")
    expect(result.isAlreadyMember).toBe(false)
  })

  it("returns isAlreadyMember=true when userId matches a member", async () => {
    mockClient.from().single
      .mockResolvedValueOnce({ data: makeInviteData(), error: null })
      .mockResolvedValueOnce({ data: { role: "owner" }, error: null })

    const result = await getInviteDetails("valid-token", "user-1")
    expect(result.isAlreadyMember).toBe(true)
  })

  it("does not throw expiry error if user is already a member", async () => {
    mockClient.from().single
      .mockResolvedValueOnce({
        data: makeInviteData({
          status: "accepted",
          expires_at: new Date(Date.now() - 86400000).toISOString(),
        }),
        error: null,
      })
      .mockResolvedValueOnce({ data: { role: "owner" }, error: null })

    const result = await getInviteDetails("expired-token", "user-1")
    expect(result.isAlreadyMember).toBe(true)
  })

  it("throws on database error", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: null,
      error: { message: "Connection failed", code: "PGRST301" },
    })

    await expect(getInviteDetails("token")).rejects.toThrow("Database error: Connection failed (Code: PGRST301)")
  })

  it("throws if invite not found", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    await expect(getInviteDetails("missing-token")).rejects.toThrow("Invalid invite link: Invite not found")
  })

  it("throws if invite is not pending and user is not a member", async () => {
    mockClient.from().single
      .mockResolvedValueOnce({ data: makeInviteData({ status: "accepted" }), error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    await expect(getInviteDetails("used-token")).rejects.toThrow("This invite link has already been used.")
  })

  it("throws if invite is expired and user is not a member", async () => {
    mockClient.from().single
      .mockResolvedValueOnce({
        data: makeInviteData({ expires_at: new Date(Date.now() - 86400000).toISOString() }),
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null })

    await expect(getInviteDetails("expired-token")).rejects.toThrow("This invite link has expired.")
  })
})
