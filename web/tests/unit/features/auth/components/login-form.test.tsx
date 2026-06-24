// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { LoginForm } from "@/features/auth/components/page/login-form"

const mockLogin = vi.hoisted(() => vi.fn())
const mockPush = vi.hoisted(() => vi.fn())
vi.mock("@/features/auth/actions/login.action", () => ({
  login: mockLogin,
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("LoginForm", () => {
  it("renders email and password fields", () => {
    render(<LoginForm />)
    const emailInputs = screen.getAllByPlaceholderText("login@gmail.com")
    expect(emailInputs[0]).toBeInTheDocument()
    const pwInputs = screen.getAllByPlaceholderText("********")
    expect(pwInputs[0]).toBeInTheDocument()
  })

  it("shows validation errors for empty fields on submit", async () => {
    render(<LoginForm />)
    const submitBtns = screen.getAllByRole("button", { name: "Sign In" })
    fireEvent.click(submitBtns[0])
    await waitFor(() => {
      const formErrors = screen.queryAllByText("Invalid email address")
      expect(formErrors.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })
  })

  it("calls login action on valid submit", async () => {
    mockLogin.mockResolvedValue({ success: true })
    render(<LoginForm />)

    const emailInputs = screen.getAllByPlaceholderText("login@gmail.com")
    fireEvent.change(emailInputs[0], { target: { value: "test@test.com" } })
    const pwInputs = screen.getAllByPlaceholderText("********")
    fireEvent.change(pwInputs[0], { target: { value: "password123" } })

    const form = emailInputs[0].closest("form")!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
    })
  })

  it("toggles password visibility", () => {
    render(<LoginForm />)
    const pwInputs = screen.getAllByPlaceholderText("********")
    expect(pwInputs[0]).toHaveAttribute("type", "password")
    const toggleBtns = screen.getAllByRole("button")
    const eyeBtn = toggleBtns.find((b) => b.querySelector(".lucide-eye-off"))
    if (eyeBtn) fireEvent.click(eyeBtn)
    expect(pwInputs[0]).toHaveAttribute("type", "text")
  })
})
