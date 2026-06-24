import { describe, it, expect } from "vitest"
import { getAvailablePageHeight } from "@/features/editor/utils/page-extraction"

describe("getAvailablePageHeight", () => {
  it("calculates height with default config", () => {
    expect(getAvailablePageHeight()).toBe(1123 - 72 - 72)
  })

  it("calculates height with custom config", () => {
    const config = {
      pageHeight: 800,
      marginTop: 50,
      marginBottom: 50,
      contentMarginTop: 8,
      contentMarginBottom: 8,
    }
    expect(getAvailablePageHeight(config)).toBe(800 - 50 - 50)
  })

  it("returns full page height when margins are zero", () => {
    const config = {
      pageHeight: 1000,
      marginTop: 0,
      marginBottom: 0,
      contentMarginTop: 8,
      contentMarginBottom: 8,
    }
    expect(getAvailablePageHeight(config)).toBe(1000)
  })

  it("returns negative value when margins exceed page height", () => {
    const config = {
      pageHeight: 100,
      marginTop: 200,
      marginBottom: 200,
      contentMarginTop: 8,
      contentMarginBottom: 8,
    }
    expect(getAvailablePageHeight(config)).toBe(-300)
  })
})
