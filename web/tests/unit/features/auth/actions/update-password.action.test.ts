import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { updatePassword } from "@/features/auth/actions/update-password.action"

vi.mock("@/lib/supabase/server")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("updatePassword action", () => {
  it("returns success on valid matching passwords", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    })
    mockClient.auth.updateUser.mockResolvedValue({ error: null })

    const result = await updatePassword({ password: "newpassword123", confirmPassword: "newpassword123" })
    expect(result).toEqual({ success: true })
    expect(mockClient.auth.updateUser).toHaveBeenCalledWith({ password: "newpassword123" })
  })

  it("returns error when passwords do not match", async () => {
    const result = await updatePassword({ password: "newpassword123", confirmPassword: "differentpassword" })
    expect(result).toEqual({ error: "Invalid input data" })
    expect(mockClient.auth.updateUser).not.toHaveBeenCalled()
  })

  it("returns error when short password", async () => {
    const result = await updatePassword({ password: "123", confirmPassword: "123" })
    expect(result).toEqual({ error: "Invalid input data" })
  })

  it("returns error when user is not authenticated", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Auth session missing!" },
    })

    const result = await updatePassword({ password: "newpassword123", confirmPassword: "newpassword123" })
    expect(result).toEqual({ error: "You are not authorized to perform this action. Your reset link may have expired." })
    expect(mockClient.auth.updateUser).not.toHaveBeenCalled()
  })

  it("returns error when supabase updateUser fails", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    })
    mockClient.auth.updateUser.mockResolvedValue({
      error: { message: "New password must be different" },
    })

    const result = await updatePassword({ password: "newpassword123", confirmPassword: "newpassword123" })
    expect(result).toEqual({ error: "New password must be different" })
  })
})
