import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { login } from "@/features/auth/actions/login.action"

vi.mock("@/lib/supabase/server")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("login action", () => {
  it("returns success on valid credentials", async () => {
    mockClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    })

    const result = await login({ email: "test@example.com", password: "password123" })
    expect(result).toEqual({ success: true })
  })

  it("returns error on invalid email format", async () => {
    const result = await login({ email: "not-an-email", password: "password123" })
    expect(result).toEqual({ error: "Invalid input data" })
  })

  it("returns error on short password", async () => {
    const result = await login({ email: "test@example.com", password: "123" })
    expect(result).toEqual({ error: "Invalid input data" })
  })

  it("returns error when supabase auth fails", async () => {
    mockClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    })

    const result = await login({ email: "test@example.com", password: "wrongpass123" })
    expect(result).toEqual({ error: "Invalid login credentials" })
  })
})
