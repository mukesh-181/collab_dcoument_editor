import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { updateDocumentTitle } from "@/features/dashboard/actions/update-document-title.action"

vi.mock("@/lib/supabase/server")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("updateDocumentTitle action", () => {
  it("updates title when user is owner", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: { role: "owner" },
      error: null,
    })

    await updateDocumentTitle("doc-1", "New Title")
    expect(mockClient.from().update).toHaveBeenCalledWith({ title: "New Title" })
  })

  it("updates title when user is editor", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: { role: "editor" },
      error: null,
    })

    await updateDocumentTitle("doc-1", "Editor Title")
    expect(mockClient.from().update).toHaveBeenCalledWith({ title: "Editor Title" })
  })

  it("throws if user is not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: vi.fn(),
    } as never)

    await expect(updateDocumentTitle("doc-1", "New Title")).rejects.toThrow("Unauthorized")
  })

  it("throws if user is a viewer", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: { role: "viewer" },
      error: null,
    })

    await expect(updateDocumentTitle("doc-1", "New Title")).rejects.toThrow(
      "You do not have permission to rename this document",
    )
  })

  it("throws if member record not found", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    await expect(updateDocumentTitle("doc-1", "New Title")).rejects.toThrow(
      "You do not have permission to rename this document",
    )
  })

  it("defaults to Untitled Document for empty title", async () => {
    mockClient.from().single.mockResolvedValueOnce({
      data: { role: "owner" },
      error: null,
    })

    await updateDocumentTitle("doc-1", "   ")
    expect(mockClient.from().update).toHaveBeenCalledWith({ title: "Untitled Document" })
  })
})
