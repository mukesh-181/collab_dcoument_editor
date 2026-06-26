import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { getDocumentById } from "@/features/document/actions/get-document-by-id.action"

vi.mock("@/lib/supabase/server")

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("getDocumentById", () => {
  it("returns document when user is a member", async () => {
    const doc = {
      id: "doc-1",
      title: "Test Doc",
      owner_id: "user-1",
      document_members: [{ role: "owner" }],
      invites: [],
      document_content_state: null,
      all_members: [{ role: "owner", user: { id: "user-1", name: "John", email: "john@test.com" } }],
    }

    mockClient.from().single.mockResolvedValueOnce({ data: doc, error: null })

    const result = await getDocumentById("doc-1")
    expect(result).toEqual(doc)
  })

  it("returns null when user is not authenticated", async () => {
    mockClient = createMockClient({ user: null })
    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const result = await getDocumentById("doc-1")
    expect(result).toBeNull()
  })

  it("returns null when document not found or no access", async () => {
    mockClient.from().single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } })

    const result = await getDocumentById("doc-1")
    expect(result).toBeNull()
  })

  it("enriches pending invites with user details from users table", async () => {
    const doc = {
      id: "doc-1",
      title: "Test Doc",
      owner_id: "user-1",
      document_members: [{ role: "owner" }],
      invites: [
        { email: "invited@test.com", status: "pending", expires_at: "2099-01-01" },
      ],
      document_content_state: null,
      all_members: [],
    }

    mockClient.from().single.mockResolvedValueOnce({ data: doc, error: null })
    mockClient.from().in.mockReturnThis()
    mockClient.from().select.mockReturnThis()
    mockClient.from().eq.mockReturnThis()

    const mockUsersResponse = { data: [{ email: "invited@test.com", name: "Invited User", image: null }], error: null }
    ;(mockClient.from() as unknown as Record<string, ReturnType<typeof vi.fn>>).in = vi.fn(() => mockUsersResponse)

    const result = await getDocumentById("doc-1")
    expect((result?.invites as Record<string, unknown>[])?.[0]?.name).toBe("Invited User")
  })
})
