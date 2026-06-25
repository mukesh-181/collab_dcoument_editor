import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { deleteDocument } from "@/features/dashboard/actions/delete-document.action"

vi.mock("@/lib/supabase/server")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("deleteDocument action", () => {
  it("soft deletes document when user is owner", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: { role: "owner" },
      error: null,
    })
    mockClient.from().eq.mockReturnThis()

    await deleteDocument("doc-1")
    expect(mockClient.from().update).toHaveBeenCalledWith({ is_deleted: true })
  })

  it("throws if user is not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: vi.fn(),
    } as never)

    await expect(deleteDocument("doc-1")).rejects.toThrow("Unauthorized")
  })

  it("throws if user is not the owner", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: { role: "editor" },
      error: null,
    })

    await expect(deleteDocument("doc-1")).rejects.toThrow("Only the owner can delete this document")
  })

  it("throws if member record not found", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    await expect(deleteDocument("doc-1")).rejects.toThrow("Only the owner can delete this document")
  })
})
