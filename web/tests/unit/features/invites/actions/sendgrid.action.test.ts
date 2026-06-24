import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn(),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  process.env.SENDGRID_API_KEY = "SG.test-key"
  process.env.SENDGRID_FROM_EMAIL = "noreply@test.com"
})

describe("sendMail", () => {
  it("sends email successfully", async () => {
    const sgMail = (await import("@sendgrid/mail")).default
    vi.mocked(sgMail.send).mockResolvedValue([{ statusCode: 202 }, {}])

    const { sendMail } = await import("@/features/invites/actions/sendgrid.action")
    const result = await sendMail({
      to: "user@test.com",
      subject: "Test",
      html: "<p>Hello</p>",
    })

    expect(result).toEqual({ success: true })
  })

  it("throws if sendgrid send fails", async () => {
    const sgMail = (await import("@/features/invites/actions/sendgrid.action"))
    vi.mocked((await import("@sendgrid/mail")).default.send).mockRejectedValue(
      new Error("SendGrid error"),
    )

    await expect(
      sgMail.sendMail({ to: "user@test.com", subject: "Test", html: "<p>Hello</p>" }),
    ).rejects.toThrow("Failed to send email via sendgrid")
  })
})
