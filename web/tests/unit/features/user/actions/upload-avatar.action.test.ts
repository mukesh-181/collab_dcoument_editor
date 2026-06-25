import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClient, type MockSupabaseClient } from "@test/unit/setup/supabase-mock"
import { createClient } from "@/lib/supabase/server"
import { uploadAvatar } from "@/features/user/actions/upload-avatar.action"

vi.mock("@/lib/supabase/server")

let mockClient: MockSupabaseClient

beforeEach(() => {
  vi.clearAllMocks()
  mockClient = createMockClient()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
})

describe("uploadAvatar action", () => {
  it("returns error if user is not authenticated", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Auth error" }
    })
    
    const formData = new FormData()
    const result = await uploadAvatar(formData)
    expect(result).toEqual({ error: "Unauthorized" })
  })

  it("returns error if no file provided", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null
    })
    
    const formData = new FormData()
    const result = await uploadAvatar(formData)
    expect(result).toEqual({ error: "No file provided" })
  })

  it("returns error if file is not an image", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null
    })
    
    const file = new File(["test"], "test.txt", { type: "text/plain" })
    const formData = new FormData()
    formData.append("file", file)
    
    const result = await uploadAvatar(formData)
    expect(result).toEqual({ error: "File must be an image" })
  })

  it("returns error if file size is too large", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null
    })
    
    const largeFile = new File([""], "large.jpg", { type: "image/jpeg" })
    Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 })
    
    const formData = new FormData()
    formData.append("file", largeFile)
    
    const result = await uploadAvatar(formData)
    expect(result).toEqual({ error: "File size must be less than 2MB" })
  })

  it("returns public URL on successful upload", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null
    })
    
    mockClient.storage.from().upload.mockResolvedValue({ error: null })
    mockClient.storage.from().getPublicUrl.mockReturnValue({
      data: { publicUrl: "http://example.com/public.jpg" }
    })
    
    const file = new File(["test"], "avatar.png", { type: "image/png" })
    Object.defineProperty(file, 'size', { value: 1024 })
    const formData = new FormData()
    formData.append("file", file)
    
    const result = await uploadAvatar(formData)
    expect(result).toEqual({ success: true, publicUrl: "http://example.com/public.jpg" })
    expect(mockClient.storage.from).toHaveBeenCalledWith("user-assets")
  })
})
