// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

const listeners: Record<string, () => void> = {}
const mockEditor = {
  isEditable: true,
  on: vi.fn((event: string, handler: () => void) => { listeners[event] = handler }),
  off: vi.fn((event: string) => { delete listeners[event] }),
  chain: () => ({
    focus: () => ({
      toggleBold: () => ({ run: vi.fn() }),
      toggleItalic: () => ({ run: vi.fn() }),
      toggleUnderline: () => ({ run: vi.fn() }),
      toggleStrike: () => ({ run: vi.fn() }),
      toggleCode: () => ({ run: vi.fn() }),
      toggleHeading: () => ({ run: vi.fn() }),
      toggleBulletList: () => ({ run: vi.fn() }),
      toggleOrderedList: () => ({ run: vi.fn() }),
      toggleTaskList: () => ({ run: vi.fn() }),
      toggleBlockquote: () => ({ run: vi.fn() }),
      toggleHighlight: () => ({ run: vi.fn() }),
      undo: () => ({ run: vi.fn() }),
      redo: () => ({ run: vi.fn() }),
      setTextAlign: () => ({ run: vi.fn() }),
      setFontFamily: () => ({ run: vi.fn() }),
      setFontSize: () => ({ run: vi.fn() }),
      setColor: () => ({ run: vi.fn() }),
      extendMarkRange: () => ({
        setLink: () => ({ run: vi.fn() }),
        unsetLink: () => ({ run: vi.fn() }),
      }),
      run: vi.fn(),
    }),
  }),
  can: () => ({
    chain: () => ({
      focus: () => ({
        undo: () => true,
        redo: () => true,
      }),
    }),
  }),
  isActive: () => false,
  getAttributes: () => ({}),
  commands: {
    setTable: vi.fn(),
    insertTable: vi.fn(),
  },
  storage: {},
}
vi.mock("@tiptap/react", () => ({
  useCurrentEditor: () => ({ editor: mockEditor }),
  EditorContent: () => null,
  BubbleMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="bubble-menu">{children}</div>,
}))

vi.mock("@/features/editor/components/toolbar/history-controls", () => ({
  HistoryControls: () => <div data-testid="history-controls" />,
}))
vi.mock("@/features/editor/components/toolbar/heading-controls", () => ({
  HeadingControls: () => <div data-testid="heading-controls" />,
}))
vi.mock("@/features/editor/components/toolbar/font-size-control", () => ({
  FontSizeControl: () => <div data-testid="font-size-control" />,
}))
vi.mock("@/features/editor/components/toolbar/format-controls", () => ({
  FormatControls: () => <div data-testid="format-controls" />,
}))
vi.mock("@/features/editor/components/toolbar/color-control", () => ({
  ColorControl: () => <div data-testid="color-control" />,
}))
vi.mock("@/features/editor/components/toolbar/highlight-control", () => ({
  HighlightControl: () => <div data-testid="highlight-control" />,
}))
vi.mock("@/features/editor/components/toolbar/link-control", () => ({
  LinkControl: () => <div data-testid="link-control" />,
}))
vi.mock("@/features/editor/components/toolbar/image-control", () => ({
  ImageControl: () => <div data-testid="image-control" />,
}))
vi.mock("@/features/editor/components/toolbar/table-control", () => ({
  TableControl: () => <div data-testid="table-control" />,
}))
vi.mock("@/features/editor/components/toolbar/alignment-controls", () => ({
  AlignmentControls: () => <div data-testid="alignment-controls" />,
}))
vi.mock("@/features/editor/components/toolbar/list-controls", () => ({
  ListControls: () => <div data-testid="list-controls" />,
}))
vi.mock("@/features/editor/components/toolbar/font-family-control", () => ({
  FontFamilyControl: () => <div data-testid="font-family-control" />,
}))

import { Toolbar } from "@/features/editor/components/toolbar"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Toolbar", () => {
  it("renders history controls", () => {
    render(<Toolbar documentId="doc-1" />)
    expect(screen.getByTestId("history-controls")).toBeInTheDocument()
  })

  it("renders heading controls", () => {
    render(<Toolbar documentId="doc-1" />)
    expect(screen.getByTestId("heading-controls")).toBeInTheDocument()
  })

  it("renders font size control", () => {
    render(<Toolbar documentId="doc-1" />)
    expect(screen.getByTestId("font-size-control")).toBeInTheDocument()
  })

  it("renders format controls", () => {
    render(<Toolbar documentId="doc-1" />)
    expect(screen.getByTestId("format-controls")).toBeInTheDocument()
  })

  it("renders color control", () => {
    render(<Toolbar documentId="doc-1" />)
    expect(screen.getByTestId("color-control")).toBeInTheDocument()
  })

  it("renders highlight control", () => {
    render(<Toolbar documentId="doc-1" />)
    expect(screen.getByTestId("highlight-control")).toBeInTheDocument()
  })

  it("renders link control", () => {
    render(<Toolbar documentId="doc-1" />)
    expect(screen.getByTestId("link-control")).toBeInTheDocument()
  })

  it("renders image control", () => {
    render(<Toolbar documentId="doc-1" />)
    expect(screen.getByTestId("image-control")).toBeInTheDocument()
  })

  it("renders table control", () => {
    render(<Toolbar documentId="doc-1" />)
    expect(screen.getByTestId("table-control")).toBeInTheDocument()
  })

  it("renders alignment controls", () => {
    render(<Toolbar documentId="doc-1" />)
    expect(screen.getByTestId("alignment-controls")).toBeInTheDocument()
  })

  it("renders list controls", () => {
    render(<Toolbar documentId="doc-1" />)
    expect(screen.getByTestId("list-controls")).toBeInTheDocument()
  })

  it("renders font family control", () => {
    render(<Toolbar documentId="doc-1" />)
    expect(screen.getByTestId("font-family-control")).toBeInTheDocument()
  })
})
