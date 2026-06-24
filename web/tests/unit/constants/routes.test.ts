import { describe, it, expect } from "vitest"
import { ROUTES } from "@/constants/routes"

describe("ROUTES", () => {
  describe("static routes", () => {
    it("HOME is /", () => {
      expect(ROUTES.HOME).toBe("/")
    })

    it("LOGIN is /login", () => {
      expect(ROUTES.LOGIN).toBe("/login")
    })

    it("REGISTER is /register", () => {
      expect(ROUTES.REGISTER).toBe("/register")
    })

    it("ABOUT is /about", () => {
      expect(ROUTES.ABOUT).toBe("/about")
    })

    it("CONTACT is /contact", () => {
      expect(ROUTES.CONTACT).toBe("/contact")
    })

    it("AUTH_CALLBACK is /auth/callback", () => {
      expect(ROUTES.AUTH_CALLBACK).toBe("/auth/callback")
    })

    it("DASHBOARD is /dashboard", () => {
      expect(ROUTES.DASHBOARD).toBe("/dashboard")
    })

    it("INBOX is /inbox", () => {
      expect(ROUTES.INBOX).toBe("/inbox")
    })
  })

  describe("dynamic routes", () => {
    it("DOCUMENT generates correct path", () => {
      expect(ROUTES.DOCUMENT("doc-123")).toBe("/dashboard/doc-123")
    })

    it("DOCUMENT handles UUID-style IDs", () => {
      expect(ROUTES.DOCUMENT("550e8400-e29b-41d4-a716-446655440000")).toBe(
        "/dashboard/550e8400-e29b-41d4-a716-446655440000",
      )
    })

    it("INVITE generates correct path with token", () => {
      expect(ROUTES.INVITE("abc123")).toBe("/dashboard/invite?token=abc123")
    })

    it("INVITE preserves full token", () => {
      expect(ROUTES.INVITE("550e8400-e29b-41d4-a716-446655440000")).toBe(
        "/dashboard/invite?token=550e8400-e29b-41d4-a716-446655440000",
      )
    })
  })

  describe("route uniqueness", () => {
    it("no two static routes are identical", () => {
      const staticRouteValues = [
        ROUTES.HOME,
        ROUTES.LOGIN,
        ROUTES.REGISTER,
        ROUTES.ABOUT,
        ROUTES.CONTACT,
        ROUTES.AUTH_CALLBACK,
        ROUTES.DASHBOARD,
        ROUTES.INBOX,
      ]
      const unique = new Set(staticRouteValues)
      expect(unique.size).toBe(staticRouteValues.length)
    })
  })
})
