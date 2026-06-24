// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { getSuggestionItems } from "@/features/editor/extensions/slash-command"

describe("getSuggestionItems", () => {
  it("returns all items when query is empty", () => {
    const items = getSuggestionItems({ query: "" })
    expect(items.length).toBeGreaterThanOrEqual(7)
  })

  it("filters items matching heading query", () => {
    const items = getSuggestionItems({ query: "heading" })
    expect(items.length).toBeGreaterThanOrEqual(1)
    items.forEach((item) => {
      expect(item.title.toLowerCase()).toContain("heading")
    })
  })

  it("filters items matching bullet query", () => {
    const items = getSuggestionItems({ query: "bullet" })
    expect(items.length).toBeGreaterThanOrEqual(1)
    expect(items[0].title).toBe("Bullet List")
  })

  it("filters items matching numbered query", () => {
    const items = getSuggestionItems({ query: "numbered" })
    expect(items.length).toBeGreaterThanOrEqual(1)
    expect(items[0].title).toBe("Numbered List")
  })

  it("filters items matching task query", () => {
    const items = getSuggestionItems({ query: "task" })
    expect(items.length).toBeGreaterThanOrEqual(1)
    expect(items[0].title).toBe("Task List")
  })

  it("filters items matching table query", () => {
    const items = getSuggestionItems({ query: "table" })
    expect(items.length).toBeGreaterThanOrEqual(1)
    expect(items[0].title).toBe("Table")
  })

  it("returns no items for non-matching query", () => {
    const items = getSuggestionItems({ query: "zzzzzz" })
    expect(items.length).toBe(0)
  })

  it("each item has title, icon, and command function", () => {
    const items = getSuggestionItems({ query: "" })
    items.forEach((item) => {
      expect(item).toHaveProperty("title")
      expect(typeof item.title).toBe("string")
      expect(item).toHaveProperty("icon")
      expect(item).toHaveProperty("command")
      expect(typeof item.command).toBe("function")
    })
  })

  it("limits results to 10 items", () => {
    const items = getSuggestionItems({ query: "" })
    expect(items.length).toBeLessThanOrEqual(10)
  })

  it("is case-insensitive", () => {
    const itemsLower = getSuggestionItems({ query: "heading" })
    const itemsUpper = getSuggestionItems({ query: "HEADING" })
    expect(itemsLower.length).toBe(itemsUpper.length)
  })
})
