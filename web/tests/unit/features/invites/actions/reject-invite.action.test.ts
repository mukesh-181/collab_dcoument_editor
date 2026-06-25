import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { rejectInvite } from "@/features/invites/actions/reject-invite.action"

vi.mock("@/lib/supabase/server")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("rejectInvite", () => {
  it("rejects invite when it belongs to the user", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: { email: "test@example.com" },
      error: null,
    })

    const result = await rejectInvite("invite-1")
    expect(result).toEqual({ success: true })
    expect(mockClient.from().update).toHaveBeenCalledWith({ status: "rejected" })
  })

  it("throws if user is not authenticated", async () => {
    mockClient = createMockClient({ user: null })
    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    await expect(rejectInvite("invite-1")).rejects.toThrow("Unauthorized")
  })

  it("throws if invite does not belong to the user", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: { email: "other@test.com" },
      error: null,
    })

    await expect(rejectInvite("invite-1")).rejects.toThrow("Unauthorized or invite not found")
  })

  it("throws if invite not found", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    await expect(rejectInvite("invite-1")).rejects.toThrow("Unauthorized or invite not found")
  })
})
