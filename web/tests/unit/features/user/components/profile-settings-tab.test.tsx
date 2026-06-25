// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { User } from "@supabase/supabase-js"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ProfileSettingsTab } from "@/features/user/components/profile-settings-tab"

vi.mock("@/features/user/actions/update-profile.action", () => ({
  updateProfile: vi.fn().mockResolvedValue({ success: true })
}))
vi.mock("@/features/user/actions/upload-avatar.action", () => ({
  uploadAvatar: vi.fn().mockResolvedValue({ success: true, publicUrl: "url" })
}))

describe("ProfileSettingsTab", () => {
  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    user_metadata: { full_name: "Test User", avatar_url: "avatar.png" }
  } as unknown as User

  it("renders profile details", () => {
    render(<ProfileSettingsTab user={mockUser} />)
    expect(screen.getByText("My Profile")).toBeInTheDocument()
    expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Test User")).toBeInTheDocument()
  })

  it("disables save button initially", () => {
    render(<ProfileSettingsTab user={mockUser} />)
    const button = screen.getByRole("button", { name: /Save Changes/i })
    expect(button).toBeDisabled()
  })

  it("enables save button when name is changed", async () => {
    render(<ProfileSettingsTab user={mockUser} />)
    const input = screen.getByDisplayValue("Test User")
    fireEvent.change(input, { target: { value: "New Name" } })
    
    await waitFor(() => {
      const button = screen.getByRole("button", { name: /Save Changes/i })
      expect(button).not.toBeDisabled()
    })
  })
})
