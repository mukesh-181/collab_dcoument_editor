/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { createDocument } from "@/features/dashboard/actions/create-document.action"

vi.mock("@/lib/supabase/server")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("createDocument action", () => {
  it("creates a document and returns its id", async () => {
    const docId = "doc-1"
    mockClient.from().single
      .mockResolvedValueOnce({ data: { id: docId, title: "My Doc", owner_id: "user-1" } as any, error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    const result = await createDocument(new FormData())
    expect(result).toBe(docId)
  })

  it("uses provided title from form data", async () => {
    const docId = "doc-2"
    mockClient.from().single
      .mockResolvedValueOnce({ data: { id: docId, title: "My Title", owner_id: "user-1" }, error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    const fd = new FormData()
    fd.set("title", "My Title")
    await createDocument(fd)

    const insertCall = mockClient.from.mock.results[0]?.value?.insert?.mock?.calls?.[0]?.[0]
    expect(insertCall).toEqual({ title: "My Title", owner_id: "user-1" })
  })

  it("assigns owner role in document_members", async () => {
    const docId = "doc-3"
    mockClient.from().single
      .mockResolvedValueOnce({ data: { id: docId, title: "Doc", owner_id: "user-1" }, error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    await createDocument(new FormData())

    const insertCall = mockClient.from().insert.mock.calls[1][0]
    expect(insertCall).toEqual({ document_id: docId, user_id: "user-1", role: "owner" })
  })

  it("throws if user is not authenticated", async () => {
    mockClient = createMockClient({ user: null, authError: { message: "No user" } })
    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    await expect(createDocument(new FormData())).rejects.toThrow("Unauthorized")
  })

  it("throws if document creation fails", async () => {
    mockClient.from().single.mockResolvedValueOnce({ data: null, error: { message: "DB error" } })

    await expect(createDocument(new FormData())).rejects.toThrow("Failed to create document")
  })

  it("throws and cleans up if member assignment fails", async () => {
    mockClient.from().single
      .mockResolvedValueOnce({ data: { id: "doc-4", title: "Doc", owner_id: "user-1" }, error: null })

    const chain = mockClient.from()
    chain.insert
      .mockImplementationOnce(function (this: any) { return this })  // doc insert: chainable
      .mockResolvedValueOnce({ error: { message: "Insert error" } })  // member insert: fails

    await expect(createDocument(new FormData())).rejects.toThrow("Failed to assign document ownership")
    expect(mockClient.from().delete).toHaveBeenCalled()
  })

  it("defaults title to 'Untitled Document' when no title provided", async () => {
    const docId = "doc-5"
    mockClient.from().single
      .mockResolvedValueOnce({ data: { id: docId, title: "Untitled Document", owner_id: "user-1" }, error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    await createDocument(new FormData())
    const insertCall = mockClient.from.mock.results[0]?.value?.insert?.mock?.calls?.[0]?.[0]
    expect(insertCall.title).toBe("Untitled Document")
  })
})
