import { describe, it, expect } from "vitest"
import { cn } from "@/utils/cn"

describe("cn", () => {
  it("merges class strings", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden")).toBe("base")
  })

  it("resolves Tailwind conflicts (last wins)", () => {
    expect(cn("px-4", "px-6")).toBe("px-6")
  })

  it("handles clsx object syntax", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe("text-red-500")
  })

  it("handles array syntax", () => {
    expect(cn(["px-2", "py-1"], "mx-4")).toBe("px-2 py-1 mx-4")
  })

  it("handles mixed arguments", () => {
    expect(cn("base", { active: true }, ["extra", "classes"])).toBe("base active extra classes")
  })

  it("removes conflicting classes", () => {
    expect(cn("p-4", "p-2")).toBe("p-2")
  })

  it("handles empty inputs", () => {
    expect(cn()).toBe("")
  })

  it("handles undefined and null values", () => {
    expect(cn("px-4", undefined, null, "py-2")).toBe("px-4 py-2")
  })
})
