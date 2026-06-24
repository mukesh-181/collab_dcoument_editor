import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { updateProfile } from "@/features/user/actions/update-profile.action"

vi.mock("@/lib/supabase/server")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("updateProfile action", () => {
  it("returns error if user is not authenticated", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Auth error" }
    })

    const result = await updateProfile({ name: "Test" })
    expect(result).toEqual({ error: "You must be logged in to update your profile." })
  })

  it("returns error if name is too short", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null
    })

    const result = await updateProfile({ name: "A" })
    expect(result).toEqual({ error: "Invalid name format." })
  })

  it("updates auth metadata successfully", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null
    })
    mockClient.auth.updateUser.mockResolvedValue({ error: null })

    const result = await updateProfile({ name: "ValidName", avatar_url: "http://example.com/image.png" })
    expect(result).toEqual({ success: true })
    expect(mockClient.auth.updateUser).toHaveBeenCalledWith({
      data: { full_name: "ValidName", avatar_url: "http://example.com/image.png" }
    })
  })

  it("returns error if auth update fails", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null
    })
    mockClient.auth.updateUser.mockResolvedValue({ error: { message: "Failed to update auth" } })

    const result = await updateProfile({ name: "ValidName" })
    expect(result).toEqual({ error: "Failed to update auth" })
  })
})
