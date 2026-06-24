import { vi } from "vitest"

type QueryResult<T = unknown> = {
  data: T | null
  error: Record<string, unknown> | null
  count?: number | null
}

type SupabaseQuery = {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  neq: ReturnType<typeof vi.fn>
  ilike: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  range: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  textSearch: ReturnType<typeof vi.fn>
  gt: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  lt: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
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
  }
  return chain
}

type AuthMethods = {
  getUser: ReturnType<typeof vi.fn>
  signInWithPassword: ReturnType<typeof vi.fn>
  signUp: ReturnType<typeof vi.fn>
  signOut: ReturnType<typeof vi.fn>
}

type StorageMethods = {
  from: ReturnType<typeof vi.fn>
}

type StorageBucket = {
  upload: ReturnType<typeof vi.fn>
  getPublicUrl: ReturnType<typeof vi.fn>
}

export type MockSupabaseClient = {
  auth: AuthMethods
  from: ReturnType<typeof vi.fn>
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
