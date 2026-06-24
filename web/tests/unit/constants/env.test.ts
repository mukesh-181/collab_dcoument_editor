import { describe, it, expect, beforeAll } from "vitest"

describe("ENV constants", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://testproject.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-anon-key"
    process.env.SENDGRID_API_KEY = "SG.test-key"
    process.env.SENDGRID_FROM_EMAIL = "noreply@test.com"
    process.env.NEXT_PUBLIC_APP_URL = "https://test.app.com"
  })

  it("reads SUPABASE_URL from environment", async () => {
    const { ENV } = await import("@/constants/env")
    expect(ENV.SUPABASE_URL).toBe("https://testproject.supabase.co")
  })

  it("reads SUPABASE_PUBLISHABLE_KEY from environment", async () => {
    const { ENV } = await import("@/constants/env")
    expect(ENV.SUPABASE_PUBLISHABLE_KEY).toBe("test-anon-key")
  })

  it("reads SENDGRID_API_KEY from environment", async () => {
    const { ENV } = await import("@/constants/env")
    expect(ENV.SENDGRID_API_KEY).toBe("SG.test-key")
  })

  it("reads SENDGRID_FROM_EMAIL from environment", async () => {
    const { ENV } = await import("@/constants/env")
    expect(ENV.SENDGRID_FROM_EMAIL).toBe("noreply@test.com")
  })

  it("reads NEXT_PUBLIC_APP_URL from environment", async () => {
    const { ENV } = await import("@/constants/env")
    expect(ENV.NEXT_PUBLIC_APP_URL).toBe("https://test.app.com")
  })

  it("uses default WEBSOCKET_URL when not set", async () => {
    delete process.env.NEXT_PUBLIC_WEBSOCKET_URL
    const { ENV } = await import("@/constants/env")
    expect(ENV.WEBSOCKET_URL).toBe("ws://localhost:1235")
  })
})
