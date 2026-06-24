// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { RegisterForm } from "@/features/auth/components/page/register-form"

const mockSignup = vi.hoisted(() => vi.fn())
const mockPush = vi.hoisted(() => vi.fn())
vi.mock("@/features/auth/actions/signup.action", () => ({
  signup: mockSignup,
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("RegisterForm", () => {
  it("renders all form fields", () => {
    render(<RegisterForm />)
    const usernameInputs = screen.getAllByPlaceholderText("johndoe")
    expect(usernameInputs[0]).toBeInTheDocument()
    const emailInputs = screen.getAllByPlaceholderText("register@gmail.com")
    expect(emailInputs[0]).toBeInTheDocument()
    const pwInputs = screen.getAllByPlaceholderText("********")
    expect(pwInputs.length).toBeGreaterThanOrEqual(2)
  })

  it("shows validation errors for empty fields on submit", async () => {
    render(<RegisterForm />)
    const submitBtns = screen.getAllByRole("button", { name: "Create Account" })
    fireEvent.click(submitBtns[0])
    await waitFor(() => {
      const errors = screen.queryAllByText("Username must be at least 3 characters")
      expect(errors.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })
  })

  it("calls signup action on valid submit", async () => {
    mockSignup.mockResolvedValue({ success: true })
    render(<RegisterForm />)

    const usernameInputs = screen.getAllByPlaceholderText("johndoe")
    fireEvent.change(usernameInputs[0], { target: { value: "john" } })
    const emailInputs = screen.getAllByPlaceholderText("register@gmail.com")
    fireEvent.change(emailInputs[0], { target: { value: "john@test.com" } })
    const pwInputs = screen.getAllByPlaceholderText("********")
    fireEvent.change(pwInputs[0], { target: { value: "password123" } })
    fireEvent.change(pwInputs[1], { target: { value: "password123" } })

    const form = usernameInputs[0].closest("form")!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalled()
    })
  })

  it("toggles password visibility", () => {
    render(<RegisterForm />)
    const pwInputs = screen.getAllByPlaceholderText("********")
    expect(pwInputs[0]).toHaveAttribute("type", "password")
    const allBtns = screen.getAllByRole("button")
    const eyeBtn = allBtns.find((b) => b.querySelector(".lucide-eye-off"))
    if (eyeBtn) fireEvent.click(eyeBtn)
    expect(pwInputs[0]).toHaveAttribute("type", "text")
  })
})
