/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest"
import { InlineQuote } from "@/features/editor/extensions/inline-quote"

describe("InlineQuote extension", () => {
  it("has the correct name", () => {
    expect(InlineQuote.name).toBe("inlineQuote")
  })

  it("is not inclusive", () => {
    expect(InlineQuote.config.inclusive).toBe(false)
  })

  it("parses <q> tags from HTML", () => {
    const parseRules = (InlineQuote.config.parseHTML as any)()
    expect(parseRules).toHaveLength(1)
    expect(parseRules[0].tag).toBe("q")
  })

  it("defines parseHTML correctly", () => {
    const parseRules = (InlineQuote.config.parseHTML as any)?.call({} as any)
    expect(parseRules).toBeDefined()
    expect(parseRules?.[0].tag).toBe("q")
  })

  it("defines renderHTML correctly", () => {
    const rendered = (InlineQuote.config.renderHTML as any)?.call({} as any, { mark: { type: InlineQuote as any, attrs: {} } as any, HTMLAttributes: {} })
    expect(rendered).toBeDefined()
    expect(rendered?.[0]).toBe("q")
    expect(typeof rendered?.[1]).toBe("object")
  })
})
