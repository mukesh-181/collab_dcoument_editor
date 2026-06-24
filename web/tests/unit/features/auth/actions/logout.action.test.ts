import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { logout } from "@/features/auth/actions/logout.action"

vi.mock("@/lib/supabase/server")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

let redirectUrl = ""

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    redirectUrl = url
    throw new Error("NEXT_REDIRECT")
  }),
}))

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  redirectUrl = ""
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("logout action", () => {
  it("calls supabase auth signOut", async () => {
    mockClient.auth.signOut.mockResolvedValue({ error: null })

    await expect(logout()).rejects.toThrow("NEXT_REDIRECT")
    expect(mockClient.auth.signOut).toHaveBeenCalledOnce()
  })

  it("redirects to login page", async () => {
    mockClient.auth.signOut.mockResolvedValue({ error: null })

    await expect(logout()).rejects.toThrow("NEXT_REDIRECT")
    expect(redirectUrl).toBe("/login")
  })
})
