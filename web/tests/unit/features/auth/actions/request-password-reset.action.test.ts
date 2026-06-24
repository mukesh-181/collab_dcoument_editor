import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { requestPasswordReset } from "@/features/auth/actions/request-password-reset.action"

vi.mock("@/lib/supabase/server")

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("requestPasswordReset action", () => {
  it("returns success on valid email", async () => {
    mockClient.auth.resetPasswordForEmail.mockResolvedValue({ error: null })

    const result = await requestPasswordReset({ email: "test@example.com" })
    expect(result).toEqual({ success: true })
    expect(mockClient.auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.com", expect.any(Object))
  })

  it("returns error on invalid email format", async () => {
    const result = await requestPasswordReset({ email: "not-an-email" })
    expect(result).toEqual({ error: "Invalid input data" })
    expect(mockClient.auth.resetPasswordForEmail).not.toHaveBeenCalled()
  })

  it("returns error when supabase auth fails", async () => {
    mockClient.auth.resetPasswordForEmail.mockResolvedValue({
      error: { message: "Rate limit exceeded" },
    })

    const result = await requestPasswordReset({ email: "test@example.com" })
    expect(result).toEqual({ error: "Rate limit exceeded" })
  })
})
