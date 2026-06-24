// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"

vi.mock("@tiptap/html", () => ({
  generateHTML: () => "<p>Hello World</p>",
}))

import { renderHook } from "@testing-library/react"
import { useDocumentPreview } from "@/features/dashboard/hooks/use-document-preview"

describe("useDocumentPreview", () => {
  it("returns empty string for null json", () => {
    const { result } = renderHook(() => useDocumentPreview(null))
    expect(result.current).toBe("")
  })

  it("returns empty string for undefined json", () => {
    const { result } = renderHook(() => useDocumentPreview(undefined))
    expect(result.current).toBe("")
  })

  it("generates html for valid json", () => {
    const json = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello World" }] }] }
    const { result } = renderHook(() => useDocumentPreview(json))
    expect(result.current).toBe("<p>Hello World</p>")
  })
})
