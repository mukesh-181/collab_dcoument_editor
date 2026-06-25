import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { acceptInvite } from "@/features/invites/actions/accept-invite.action"

vi.mock("@/lib/supabase/server")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

function makeInvite(overrides: Record<string, unknown> = {}) {
  return {
    id: "invite-1",
    document_id: "doc-1",
    role: "editor",
    status: "pending",
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    email: "invited@test.com",
    ...overrides,
  }
}

describe("acceptInvite", () => {
  it("accepts a valid email invite and adds user to members", async () => {
    mockClient.from().single
      .mockResolvedValueOnce({ data: makeInvite(), error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    const docId = await acceptInvite("token-123")
    expect(docId).toBe("doc-1")
  })

  it("accepts a valid universal link (email=null) and adds user to members", async () => {
    mockClient.from().single
      .mockResolvedValueOnce({ data: makeInvite({ email: null }), error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    const docId = await acceptInvite("token-456")
    expect(docId).toBe("doc-1")
  })

  it("returns document_id if user is already a member", async () => {
    mockClient.from().single
      .mockResolvedValueOnce({ data: makeInvite(), error: null })
      .mockResolvedValueOnce({ data: { role: "editor" }, error: null })

    const docId = await acceptInvite("token-123")
    expect(docId).toBe("doc-1")
    expect(mockClient.from().insert).not.toHaveBeenCalled()
  })

  it("throws if user is not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: vi.fn(),
    } as never)

    await expect(acceptInvite("token-123")).rejects.toThrow("Unauthorized")
  })

  it("throws if invite is not found", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: null,
      error: { message: "Not found" },
    })

    await expect(acceptInvite("invalid-token")).rejects.toThrow("Invalid or expired invite link")
  })

  it("throws if invite has already been used (not pending)", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: makeInvite({ status: "accepted" }),
      error: null,
    })

    await expect(acceptInvite("token-123")).rejects.toThrow("This invite link has already been used")
  })

  it("throws if invite has expired", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: makeInvite({ expires_at: new Date(Date.now() - 86400000).toISOString() }),
      error: null,
    })

    await expect(acceptInvite("expired-token")).rejects.toThrow("This invite link has expired")
  })
})
