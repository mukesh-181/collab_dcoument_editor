import { describe, it, expect } from "vitest"
import { FontSize, type FontSizeOptions } from "@/features/editor/extensions/font-size"

const mockThis = { options: { types: ["textStyle"] as string[] } }

function getFontSizeAttrs() {
  const globalAttrs = (
    FontSize.config.addGlobalAttributes as (
      this: { options: FontSizeOptions },
    ) => ReturnType<NonNullable<typeof FontSize.config.addGlobalAttributes>>
  ).call(mockThis)
  return globalAttrs[0].attributes.fontSize as {
    default: null
    parseHTML: (el: HTMLElement) => string | null
    renderHTML: (attrs: { fontSize?: string | null }) => Record<string, string>
  }
}

describe("FontSize extension", () => {
  it("has the correct name", () => {
    expect(FontSize.name).toBe("fontSize")
  })

  it("has textStyle as default type", () => {
    expect(FontSize.options).toBeDefined()
    expect(FontSize.options.types).toEqual(["textStyle"])
  })

  it("parses fontSize from inline style", () => {
    const { parseHTML } = getFontSizeAttrs()
    const el = { style: { fontSize: "18px" } } as HTMLElement
    expect(parseHTML(el)).toBe("18px")
  })

  it("parses fontSize and strips double quotes", () => {
    const { parseHTML } = getFontSizeAttrs()
    const el = { style: { fontSize: '"14px"' } } as HTMLElement
    expect(parseHTML(el)).toBe("14px")
  })

  it("parses fontSize and strips single quotes", () => {
    const { parseHTML } = getFontSizeAttrs()
    const el = { style: { fontSize: "'16px'" } } as HTMLElement
    expect(parseHTML(el)).toBe("16px")
  })

  it("renders style object when fontSize is set", () => {
    const { renderHTML } = getFontSizeAttrs()
    expect(renderHTML({ fontSize: "20px" })).toEqual({ style: "font-size: 20px" })
  })

  it("returns empty object when fontSize is null", () => {
    const { renderHTML } = getFontSizeAttrs()
    expect(renderHTML({ fontSize: null })).toEqual({})
  })

  it("returns empty object when fontSize is undefined", () => {
    const { renderHTML } = getFontSizeAttrs()
    expect(renderHTML({})).toEqual({})
  })
})
