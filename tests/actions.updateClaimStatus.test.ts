import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Next cookies used by supabase server client
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: () => {} })),
}))

// Mock Supabase server client to avoid real cookies/auth
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }) },
  })),
}))

// Variables to control DB mock behavior
let existingClaim: any = { employeeId: 1, status: 'draft' }
let updatedClaim: any = { id: 123, status: 'submitted', adminNotes: null }
let binding: any = { employeeId: 1, name: 'User', employeeCode: 18, department: 'Tech Department', role: 'employee' }

// Mock DB layer used inside actions
vi.mock('@/lib/db/drizzle', () => {
  const makeChain = (result: any) => ({
    innerJoin: () => makeChain(result),
    where: () => ({ limit: () => result }),
    orderBy: () => result,
  })
  return {
    db: {
      select: vi.fn((sel?: any) => ({
        from: vi.fn(() => {
          const keys = sel ? Object.keys(sel) : []
          // claims select (employeeId + status)
          if (keys.includes('status') && keys.includes('employeeId') && keys.length <= 2) {
            return makeChain([existingClaim])
          }
          // user binding select (employee fields present)
          if (keys.includes('employeeCode') && keys.includes('department') && keys.includes('role')) {
            return makeChain(binding ? [binding] : [])
          }
          // default: empty array for other selects used in actions
          return makeChain([])
        }),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => [updatedClaim]) })) })),
      })),
    },
  }
})

// Import after mocks
import * as actions from '@/lib/actions'

describe('updateClaimStatus', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    existingClaim = { employeeId: 1, status: 'draft' }
    updatedClaim = { id: 123, status: 'submitted', adminNotes: null }
  })

  it('blocks non-owner and non-admin user', async () => {
    binding = { employeeId: 99, name: 'U', employeeCode: 1, department: 'Tech Department', role: 'employee' }
    existingClaim = { employeeId: 1, status: 'draft' }
    const res = await actions.updateClaimStatus(123, 'submitted')
    expect(res.success).toBe(false)
    expect(res.error).toContain('无权修改此申请')
  })

  it('allows owner to submit draft → submitted', async () => {
    binding = { employeeId: 1, name: 'U', employeeCode: 1, department: 'Tech Department', role: 'employee' }
    existingClaim = { employeeId: 1, status: 'draft' }
    updatedClaim = { id: 123, status: 'submitted', adminNotes: null }

    const res = await actions.updateClaimStatus(123, 'submitted')
    expect(res.success).toBe(true)
    expect(res.data?.status).toBe('submitted')
  })

  it('allows admin to approve with notes', async () => {
    binding = { employeeId: 2, name: 'Admin', employeeCode: 2, department: 'Tech Department', role: 'admin' }
    existingClaim = { employeeId: 1, status: 'submitted' }
    updatedClaim = { id: 123, status: 'approved', adminNotes: 'OK' }

    const res = await actions.updateClaimStatus(123, 'approved', 'OK')
    expect(res.success).toBe(true)
    expect(res.data?.status).toBe('approved')
  })
})
