import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Next cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: () => {} })),
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }) },
  })),
}))

let claimRow: any = { id: 1, employeeId: 1, status: 'submitted', totalAmount: '0', createdAt: null, adminNotes: null }
let binding: any = { employeeId: 99, name: 'U', employeeCode: 1, department: 'Tech Department', role: 'employee' }

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
          if (keys.includes('adminNotes') && keys.includes('employeeId')) {
            return makeChain([claimRow])
          }
          if (keys.includes('employeeCode') && keys.includes('department') && keys.includes('role')) {
            return makeChain(binding ? [binding] : [])
          }
          return makeChain([])
        }),
      })),
    },
  }
})

import * as actions from '@/lib/actions'

describe('getClaimDetails permission', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    claimRow = { id: 1, employeeId: 1, status: 'submitted', totalAmount: '0', createdAt: null, adminNotes: null }
  })

  it('denies access to non-owner non-admin', async () => {
    binding = { employeeId: 99, name: 'U', employeeCode: 1, department: 'Tech Department', role: 'employee' }
    claimRow = { ...claimRow, employeeId: 1 }
    const res = await actions.getClaimDetails(1)
    expect(res.success).toBe(false)
    expect(res.error).toContain('无权查看此申请')
  })

  it('allows admin to view others claim', async () => {
    binding = { employeeId: 99, name: 'Admin', employeeCode: 1, department: 'Tech Department', role: 'admin' }
    claimRow = { ...claimRow, employeeId: 1 }
    const res = await actions.getClaimDetails(1)
    expect(res.success).toBe(true)
    expect((res as any).data?.claim?.id).toBe(1)
  })
})
