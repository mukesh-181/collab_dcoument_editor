// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { ActiveUsersCluster } from "@/features/document/components/page/active-users-cluster"
import { DocumentProvider, useDocumentSync } from "@/features/document/components/page/document-context"
import { useEffect } from "react"
import type { ActiveUser } from "@/features/document/components/page/document-context"

function ActiveUsersSetter({ users }: { users: ActiveUser[] }) {
  const { setActiveUsers } = useDocumentSync()
  useEffect(() => { setActiveUsers(users) }, [users, setActiveUsers])
  return null
}

function renderWithUsers(users: ActiveUser[]) {
  return render(
    <DocumentProvider>
      <ActiveUsersSetter users={users} />
      <ActiveUsersCluster />
    </DocumentProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ActiveUsersCluster", () => {
  it("returns null when no active users", () => {
    const { container } = renderWithUsers([])
    // ActiveUsersCluster returns null, so nothing renders
    const avatars = container.querySelectorAll('[class*="avatar"]')
    expect(avatars.length).toBe(0)
  })

  it("renders user avatars for each active user", () => {
    const users: ActiveUser[] = [
      { clientId: 1, user: { name: "Alice", color: "#ff0000", image: "" } },
      { clientId: 2, user: { name: "Bob", color: "#00ff00", image: "" } },
    ]
    renderWithUsers(users)
    expect(screen.getByText("A")).toBeInTheDocument()
    expect(screen.getByText("B")).toBeInTheDocument()
  })

  it("shows Alice's name from context", () => {
    const users: ActiveUser[] = [
      { clientId: 1, user: { name: "Alice", color: "#ff0000" } },
    ]
    renderWithUsers(users)
    // Avatar fallback renders the first initial
    expect(screen.getByText("A")).toBeInTheDocument()
  })
})
