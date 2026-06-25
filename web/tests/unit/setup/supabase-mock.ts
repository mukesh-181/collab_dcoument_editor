/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from "vitest"

type QueryResult<T = unknown> = {
  data: T | null
  error: Record<string, unknown> | null
  count?: number | null
}

type SupabaseQuery = {
  select: any
  insert: any
  update: any
  delete: any
  eq: any
  neq: any
  ilike: any
  in: any
  order: any
  range: any
  single: any
  limit: any
  maybeSingle: any
  textSearch: any
  gt: any
  gte: any
  lt: any
  lte: any
  not: any
  or: any
}

function createMockChain(overrides: Partial<QueryResult> = {}): SupabaseQuery {
  const makeResult = () => ({
    data: "data" in overrides ? overrides.data : null,
    error: "error" in overrides ? overrides.error : null,
    count: "count" in overrides ? overrides.count : null,
  })

  const chain: SupabaseQuery = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    range: vi.fn(() => chain),
    single: vi.fn(() => makeResult()),
    limit: vi.fn(() => chain),
    maybeSingle: vi.fn(() => makeResult()),
    textSearch: vi.fn(() => chain),
    gt: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lt: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    not: vi.fn(() => chain),
    or: vi.fn(() => chain),
  }
  return chain
}

type AuthMethods = {
  getUser: any
  signInWithPassword: any
  signUp: any
  signOut: any
  resetPasswordForEmail: any
  updateUser: any
}

type StorageMethods = {
  from: any
}

type StorageBucket = {
  upload: any
  getPublicUrl: any
}

export type MockSupabaseClient = {
  auth: AuthMethods
  from: any
  storage: StorageMethods
}

export function createMockClient(overrides?: {
  user?: Record<string, unknown> | null
  authError?: Record<string, unknown> | null
  queryResult?: Partial<QueryResult>
}): MockSupabaseClient {
  const user = overrides?.user ?? { id: "user-1", email: "test@example.com" }
  const authError = overrides?.authError ?? null
  const queryResult = overrides?.queryResult ?? {}

  const chain = createMockChain(queryResult)

  const auth: AuthMethods = {
    getUser: vi.fn().mockResolvedValue({ data: { user }, error: authError }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user }, error: authError }),
    signUp: vi.fn().mockResolvedValue({ data: { user }, error: authError }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user }, error: authError }),
  }

  const storageBucket: StorageBucket = {
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn().mockReturnValue({
      data: { publicUrl: "https://test.supabase.co/storage/v1/object/public/document-assets/test.png" },
    }),
  }

  const storage: StorageMethods = {
    from: vi.fn(() => storageBucket),
  }

  return {
    auth,
    from: vi.fn(() => chain),
    storage,
  }
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))
