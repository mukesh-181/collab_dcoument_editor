import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { signup } from "@/features/auth/actions/signup.action"

vi.mock("@/lib/supabase/server")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("signup action", () => {
  const validData = {
    username: "john",
    email: "john@example.com",
    password: "password123",
    confirmPassword: "password123",
  }

  it("returns success on valid registration", async () => {
    mockClient.auth.signUp.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    })

    const result = await signup(validData)
    expect(result).toEqual({ success: true })
  })

  it("passes username to user metadata", async () => {
    mockClient.auth.signUp.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    })

    await signup(validData)
    expect(mockClient.auth.signUp).toHaveBeenCalledWith({
      email: "john@example.com",
      password: "password123",
      options: {
        data: { username: "john" },
      },
    })
  })

  it("returns error if passwords do not match", async () => {
    const result = await signup({
      ...validData,
      confirmPassword: "different",
    })
    expect(result).toEqual({ error: "Invalid input data" })
  })

  it("returns error when supabase signup fails", async () => {
    mockClient.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered" },
    })

    const result = await signup(validData)
    expect(result).toEqual({ error: "User already registered" })
  })

  it("returns error on short username", async () => {
    const result = await signup({ ...validData, username: "jo" })
    expect(result).toEqual({ error: "Invalid input data" })
  })
})
