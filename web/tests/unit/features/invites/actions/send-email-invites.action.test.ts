import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { sendEmailInvites } from "@/features/invites/actions/send-email-invites.action"

vi.mock("@/lib/supabase/server")
vi.mock("@/features/invites/actions/sendgrid.action", () => ({
  sendMail: vi.fn().mockResolvedValue({ success: true }),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"
})

let mockClient: MockSupabaseClient

async function setupMock(overrides?: { user?: Record<string, unknown> | null }) {
  mockClient = createMockClient(overrides)
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
}

describe("sendEmailInvites", () => {
  it("sends invites to valid emails", async () => {
    await setupMock()

    mockClient.from().single
      .mockResolvedValueOnce({ data: { role: "owner" }, error: null })
      .mockResolvedValueOnce({ data: { title: "Test Document" }, error: null })

    mockClient.from().in.mockReturnThis()
    mockClient.from().select.mockReturnThis()
    mockClient.from().eq.mockReturnThis()
    mockClient.from().insert.mockResolvedValueOnce({ error: null })

    const result = await sendEmailInvites("doc-1", ["friend@test.com"], "editor")
    expect(result).toEqual({ success: true })
  })

  it("throws if user invites themselves", async () => {
    await setupMock()

    await expect(
      sendEmailInvites("doc-1", ["test@example.com"], "editor"),
    ).rejects.toThrow("You cannot invite yourself.")
  })

  it("throws if no valid emails provided", async () => {
    await setupMock()

    await expect(
      sendEmailInvites("doc-1", [], "editor"),
    ).rejects.toThrow("No valid emails provided.")
  })

  it("throws if user lacks permission", async () => {
    await setupMock()

    mockClient.from().single.mockResolvedValueOnce({
      data: { role: "viewer" },
      error: null,
    })

    await expect(
      sendEmailInvites("doc-1", ["friend@test.com"], "editor"),
    ).rejects.toThrow("You do not have permission to invite users to this document")
  })

  it("throws if all recipients are already members or have pending invites", async () => {
    await setupMock()

    mockClient.from().single
      .mockResolvedValueOnce({ data: { role: "owner" }, error: null })
      // users query gets a registered user
      .mockResolvedValueOnce(null)

    const chain = mockClient.from()
    chain.select.mockReturnThis()
    chain.in
      .mockResolvedValueOnce({ data: [{ id: "user-2", email: "friend@test.com" }], error: null })
      .mockResolvedValueOnce({ data: [{ user_id: "user-2" }], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
    chain.eq.mockReturnThis()

    await expect(
      sendEmailInvites("doc-1", ["friend@test.com"], "editor"),
    ).rejects.toThrow(
      "The selected users already have an active invitation or are already members",
    )
  })
})
