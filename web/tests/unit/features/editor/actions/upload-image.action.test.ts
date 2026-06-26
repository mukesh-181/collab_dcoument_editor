import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { uploadImage } from "@/features/editor/actions/upload-image.action"

vi.mock("@/lib/supabase/server")

let mockClient: MockSupabaseClient

function makeFile(name: string, type: string, size: number): File {
  const blob = new Blob(["x".repeat(size)], { type })
  return new File([blob], name, { type })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("uploadImage", () => {
  it("uploads a valid image and returns public URL", async () => {
    const fd = new FormData()
    fd.set("file", makeFile("photo.png", "image/png", 1024))

    const result = await uploadImage("doc-1", fd)
    expect(result).toEqual({
      success: true,
      publicUrl: "https://test.supabase.co/storage/v1/object/public/document-assets/test.png",
    })
  })

  it("returns error if user is not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      storage: { from: vi.fn() },
    } as never)

    const fd = new FormData()
    fd.set("file", makeFile("photo.png", "image/png", 1024))

    const result = await uploadImage("doc-1", fd)
    expect(result).toEqual({ error: "Unauthorized" })
  })

  it("returns error if no file provided", async () => {
    const result = await uploadImage("doc-1", new FormData())
    expect(result).toEqual({ error: "No file provided" })
  })

  it("returns error if file is not an image", async () => {
    const fd = new FormData()
    fd.set("file", makeFile("doc.pdf", "application/pdf", 1024))

    const result = await uploadImage("doc-1", fd)
    expect(result).toEqual({ error: "File must be an image" })
  })

  it("returns error if file exceeds 5MB", async () => {
    const fd = new FormData()
    fd.set("file", makeFile("large.png", "image/png", 6 * 1024 * 1024))

    const result = await uploadImage("doc-1", fd)
    expect(result).toEqual({ error: "File size must be less than 5MB" })
  })

  it("returns error if storage upload fails", async () => {
    const fd = new FormData()
    fd.set("file", makeFile("photo.png", "image/png", 1024))

    mockClient.storage.from("document-assets").upload.mockResolvedValue({
      error: { message: "Bucket not found" },
    })

    const result = await uploadImage("doc-1", fd)
    expect(result).toEqual({ error: "Failed to upload image." })
  })
})
