import { describe, it, expect } from "vitest"
import { loginSchema, registerSchema } from "@/features/auth/schemas/auth.schema"

describe("loginSchema", () => {
  it("validates a valid login input", () => {
    const result = loginSchema.safeParse({
      email: "john@example.com",
      password: "password123",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email")
    }
  })

  it("rejects short password", () => {
    const result = loginSchema.safeParse({
      email: "john@example.com",
      password: "1234567",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("password")
    }
  })

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing password field", () => {
    const result = loginSchema.safeParse({
      email: "john@example.com",
    })
    expect(result.success).toBe(false)
  })
})

describe("registerSchema", () => {
  it("validates a valid register input", () => {
    const result = registerSchema.safeParse({
      username: "john",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "password123",
    })
    expect(result.success).toBe(true)
  })

  it("rejects short username", () => {
    const result = registerSchema.safeParse({
      username: "jo",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "password123",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("username")
    }
  })

  it("rejects when passwords do not match", () => {
    const result = registerSchema.safeParse({
      username: "john",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "different",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const confirmPasswordIssue = result.error.issues.find(
        (issue) => issue.path[0] === "confirmPassword"
      )
      expect(confirmPasswordIssue).toBeDefined()
      expect(confirmPasswordIssue!.message).toBe("Passwords do not match")
    }
  })

  it("rejects invalid email in registration", () => {
    const result = registerSchema.safeParse({
      username: "john",
      email: "not-an-email",
      password: "password123",
      confirmPassword: "password123",
    })
    expect(result.success).toBe(false)
  })
})
