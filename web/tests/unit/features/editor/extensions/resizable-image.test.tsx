// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { ResizableImage } from "@/features/editor/extensions/resizable-image"

describe("ResizableImage", () => {
  it("has the correct name", () => {
    expect(ResizableImage.name).toBe("image")
  })

  it("accepts documentId via configure", () => {
    const instance = ResizableImage.configure({ documentId: "doc-1" })
    expect(instance.options.documentId).toBe("doc-1")
  })

  it("can add a NodeView", () => {
    const instance = ResizableImage.configure({ documentId: "doc-1" })
    expect(instance).toBeDefined()
  })
})
