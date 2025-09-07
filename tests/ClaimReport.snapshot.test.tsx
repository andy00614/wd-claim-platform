import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ClaimReport from '@/app/admin/reports/components/ClaimReport'

describe('ClaimReport snapshot-ish', () => {
  it('renders key fields', () => {
    render(
      <ClaimReport
        claim={{ id: 42, status: 'submitted', totalAmount: '123.45', createdAt: new Date('2025-09-05'), adminNotes: 'Note' }}
        items={[{
          id: 1,
          date: new Date('2025-09-01'),
          itemTypeNo: 'C2',
          itemTypeName: 'Taxi',
          note: 'Ride',
          details: 'From A to B',
          currencyCode: 'SGD',
          amount: '45.8',
          rate: '1',
          sgdAmount: '45.8',
          evidenceNo: 'E001',
          attachments: [],
        }]}
        attachments={[]}
        employee={{ name: 'Tester', employeeCode: 18, department: 'Tech Department' }}
      />
    )

    expect(screen.getByText(/Expense Claim Report/i)).toBeInTheDocument()
    expect(screen.getByText(/CL-2024-0042/)).toBeInTheDocument()
    expect(screen.getByText('Tester')).toBeInTheDocument()
    expect(screen.getByText(/Taxi/)).toBeInTheDocument()
  })
})
