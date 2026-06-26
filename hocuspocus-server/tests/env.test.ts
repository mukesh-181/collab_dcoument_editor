import { describe, it, expect, beforeEach, vi } from "vitest"

describe("Hocuspocus Server ENV", () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://testproject.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-anon-key"
    process.env.PORT = "9999"
  })

  it("reads SUPABASE_URL from environment", async () => {
    const { ENV } = await import("../src/config/env")
    expect(ENV.SUPABASE_URL).toBe("https://testproject.supabase.co")
  })

  it("reads SUPABASE_PUBLISHABLE_KEY from environment", async () => {
    const { ENV } = await import("../src/config/env")
    expect(ENV.SUPABASE_PUBLISHABLE_KEY).toBe("test-anon-key")
  })

  it("uses custom PORT from environment", async () => {
    const { ENV } = await import("../src/config/env")
    expect(ENV.PORT).toBe(9999)
  })

  it("uses default PORT 1235 when not set", async () => {
    delete process.env.PORT
    const { ENV } = await import("../src/config/env")
    expect(ENV.PORT).toBe(1235)
  })
})
