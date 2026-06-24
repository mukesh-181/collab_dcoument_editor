// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"

const mockRequestReset = vi.hoisted(() => vi.fn())
vi.mock("@/features/auth/actions/request-password-reset.action", () => ({
  requestPasswordReset: mockRequestReset,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ForgotPasswordForm", () => {
  it("renders email field", () => {
    render(<ForgotPasswordForm />)
    const emailInput = screen.getByPlaceholderText("login@gmail.com")
    expect(emailInput).toBeInTheDocument()
  })

  it("shows validation error for empty field on submit", async () => {
    render(<ForgotPasswordForm />)
    const submitBtn = screen.getByRole("button", { name: "Send Reset Link" })
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument()
    })
  })

  it("calls reset action on valid submit", async () => {
    mockRequestReset.mockResolvedValue({ success: true })
    render(<ForgotPasswordForm />)

    const emailInput = screen.getByPlaceholderText("login@gmail.com")
    fireEvent.change(emailInput, { target: { value: "test@test.com" } })

    const form = emailInput.closest("form")!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockRequestReset).toHaveBeenCalledWith({ email: "test@test.com" })
    })
  })
})
