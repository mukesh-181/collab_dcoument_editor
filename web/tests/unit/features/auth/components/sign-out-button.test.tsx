// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { SignOutButton } from "@/features/auth/components/sign-out-button"

const mockLogout = vi.hoisted(() => vi.fn())
vi.mock("@/features/auth/actions/logout.action", () => ({
  logout: mockLogout,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("SignOutButton", () => {
  it("renders the sign out trigger button with text", () => {
    render(<SignOutButton />)
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument()
  })

  it("opens confirmation dialog on click", () => {
    render(<SignOutButton />)
    // Radix Dialog portal is always mounted — check data-state instead
    const trigger = screen.getAllByRole("button", { name: /sign out/i })[0]
    fireEvent.click(trigger)
    expect(screen.getByText("Are you sure you want to log out?")).toBeInTheDocument()
  })

  it("calls logout action on confirm", () => {
    render(<SignOutButton />)
    const trigger = screen.getAllByRole("button", { name: /sign out/i })[0]
    fireEvent.click(trigger)
    const allSignOutBtns = screen.getAllByRole("button", { name: /sign out/i })
    const confirmBtn = allSignOutBtns[allSignOutBtns.length - 1]
    fireEvent.click(confirmBtn)
    expect(mockLogout).toHaveBeenCalledOnce()
  })

  it("renders icon-only variant with icon", () => {
    const { container } = render(<SignOutButton iconOnly />)
    expect(container.querySelector(".lucide-log-out")).toBeInTheDocument()
  })
})
