import { describe, it, expect } from "vitest"
import { getInitials } from "@/utils/string-utils"

describe("getInitials", () => {
  it("returns initials from first and last name", () => {
    expect(getInitials("John Doe")).toBe("JD")
  })

  it("returns first letter when only one name is provided", () => {
    expect(getInitials("John")).toBe("J")
  })

  it("returns first and last letter from middle name", () => {
    expect(getInitials("John Michael Doe")).toBe("JD")
  })

  it("returns email first letter when name is empty", () => {
    expect(getInitials("", "john@example.com")).toBe("J")
  })

  it("returns fallback when both name and email are null", () => {
    expect(getInitials(null, null)).toBe("?")
  })

  it("returns fallback when both name and email are empty", () => {
    expect(getInitials("", "")).toBe("?")
  })

  it("handles trailing whitespace in name", () => {
    expect(getInitials("  John Doe  ")).toBe("JD")
  })

  it("handles trailing whitespace in email", () => {
    expect(getInitials("", "  john@example.com  ")).toBe("J")
  })

  it("name has priority over email", () => {
    expect(getInitials("Alice", "bob@example.com")).toBe("A")
  })
})
