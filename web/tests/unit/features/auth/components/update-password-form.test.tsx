// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { UpdatePasswordForm } from "@/features/auth/components/update-password-form"

const mockUpdatePassword = vi.hoisted(() => vi.fn())
const mockPush = vi.hoisted(() => vi.fn())

vi.mock("@/features/auth/actions/update-password.action", () => ({
  updatePassword: mockUpdatePassword,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("UpdatePasswordForm", () => {
  it("renders password fields", () => {
    render(<UpdatePasswordForm />)
    const inputs = screen.getAllByPlaceholderText("********")
    expect(inputs[0]).toBeInTheDocument()
    expect(inputs[1]).toBeInTheDocument()
  })

  it("shows validation error if passwords do not match", async () => {
    render(<UpdatePasswordForm />)
    const inputs = screen.getAllByPlaceholderText("********")
    const pwInput = inputs[0]
    const confInput = inputs[1]
    
    fireEvent.change(pwInput, { target: { value: "password123" } })
    fireEvent.change(confInput, { target: { value: "password456" } })
    
    const submitBtn = screen.getByRole("button", { name: "Update Password" })
    fireEvent.click(submitBtn)
    
    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument()
    })
  })

  it("calls update action on valid submit", async () => {
    mockUpdatePassword.mockResolvedValue({ success: true })
    render(<UpdatePasswordForm />)

    const inputs = screen.getAllByPlaceholderText("********")
    const pwInput = inputs[0]
    const confInput = inputs[1]
    
    fireEvent.change(pwInput, { target: { value: "password123" } })
    fireEvent.change(confInput, { target: { value: "password123" } })

    const form = pwInput.closest("form")!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith({ password: "password123", confirmPassword: "password123" })
      expect(mockPush).toHaveBeenCalledWith("/dashboard")
    })
  })
})
