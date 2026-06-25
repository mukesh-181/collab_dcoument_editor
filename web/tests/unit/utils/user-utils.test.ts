import { describe, it, expect } from "vitest"
import {
  getUserName,
  getUserEmail,
  getUserImage,
  getUserRole,
  extractUserInfo,
} from "@/utils/user-utils"

describe("getUserName", () => {
  it("returns name when name is provided", () => {
    expect(getUserName("John Doe", "john@example.com")).toBe("John Doe")
  })

  it("returns email username when name is empty and email is provided", () => {
    expect(getUserName("", "john@example.com")).toBe("john")
  })

  it("returns email username when name is null and email is provided", () => {
    expect(getUserName(null, "john@example.com")).toBe("john")
  })

  it("returns fallback when both name and email are empty", () => {
    expect(getUserName("", "")).toBe("Anonymous User")
  })

  it("returns fallback when both name and email are null", () => {
    expect(getUserName(null, null)).toBe("Anonymous User")
  })

  it("returns fallback when name has only whitespace", () => {
    expect(getUserName("   ", "john@example.com")).toBe("john")
  })
})

describe("getUserEmail", () => {
  it("returns email when provided", () => {
    expect(getUserEmail("john@example.com")).toBe("john@example.com")
  })

  it("returns fallback when email is null", () => {
    expect(getUserEmail(null)).toBe("No email provided")
  })

  it("returns fallback when email is empty string", () => {
    expect(getUserEmail("")).toBe("")
  })
})

describe("getUserImage", () => {
  it("returns image when provided", () => {
    expect(getUserImage("https://example.com/avatar.png")).toBe("https://example.com/avatar.png")
  })

  it("returns empty string when image is null", () => {
    expect(getUserImage(null)).toBe("")
  })
})

describe("getUserRole", () => {
  it("returns role when provided", () => {
    expect(getUserRole("editor")).toBe("editor")
  })

  it("returns default viewer when role is null", () => {
    expect(getUserRole(null)).toBe("viewer")
  })
})

describe("extractUserInfo", () => {
  it("extracts user info from user object with name, email, and image", () => {
    const result = extractUserInfo(
      { name: "John Doe", email: "john@example.com", image: "https://example.com/avatar.png" },
      "editor",
    )
    expect(result).toEqual({
      name: "John Doe",
      email: "john@example.com",
      image: "https://example.com/avatar.png",
      role: "editor",
    })
  })

  it("uses user_metadata.avatar_url when image is not provided", () => {
    const result = extractUserInfo(
      { name: "John Doe", email: "john@example.com", user_metadata: { avatar_url: "https://example.com/avatar.png" } },
    )
    expect(result.image).toBe("https://example.com/avatar.png")
  })

  it("uses fallbacks when user object is empty", () => {
    const result = extractUserInfo({})
    expect(result).toEqual({
      name: "Anonymous User",
      email: "No email provided",
      image: "",
      role: "viewer",
    })
  })

  it("uses role from user object when explicit role is not provided", () => {
    const result = extractUserInfo({ name: "John Doe", role: "owner" })
    expect(result.role).toBe("owner")
  })

  it("explicit role overrides user object role", () => {
    const result = extractUserInfo({ name: "John Doe", role: "viewer" }, "editor")
    expect(result.role).toBe("editor")
  })
})
