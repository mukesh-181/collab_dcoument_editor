import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { createInviteLink } from "@/features/invites/actions/create-invite.action"

vi.mock("@/lib/supabase/server")

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("createInviteLink", () => {
  it("creates a universal invite link and returns token", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: { role: "owner" },
      error: null,
    })

    const token = await createInviteLink("doc-1", "editor")
    expect(token).toBeDefined()
    expect(typeof token).toBe("string")
    expect(token.length).toBeGreaterThan(0)
  })

  it("inserts invite with correct role", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: { role: "owner" },
      error: null,
    })

    await createInviteLink("doc-1", "viewer")
    const insertCall = mockClient.from().insert.mock.calls[0]?.[0] as Record<string, unknown>
    expect(insertCall.document_id).toBe("doc-1")
    expect(insertCall.role).toBe("viewer")
    expect(insertCall.status).toBe("pending")
  })

  it("throws if user is not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: vi.fn(),
    } as never)

    await expect(createInviteLink("doc-1", "editor")).rejects.toThrow("Unauthorized")
  })

  it("throws if user lacks permission (viewer)", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: { role: "viewer" },
      error: null,
    })

    await expect(createInviteLink("doc-1", "editor")).rejects.toThrow(
      "You do not have permission to invite users to this document",
    )
  })

  it("throws if member record not found", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    await expect(createInviteLink("doc-1", "editor")).rejects.toThrow(
      "You do not have permission to invite users to this document",
    )
  })
})
