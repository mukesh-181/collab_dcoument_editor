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
    const parseRules = InlineQuote.config.parseHTML()
    expect(parseRules).toHaveLength(1)
    expect(parseRules[0].tag).toBe("q")
  })

  it("renders as <q> tag", () => {
    const rendered = InlineQuote.config.renderHTML({ HTMLAttributes: {} })
    expect(rendered[0]).toBe("q")
  })

  it("renders merges HTML attributes", () => {
    const rendered = InlineQuote.config.renderHTML({
      HTMLAttributes: { class: "custom-quote", "data-testid": "quote" },
    })
    expect(rendered[0]).toBe("q")
    expect(typeof rendered[1]).toBe("object")
  })
})
