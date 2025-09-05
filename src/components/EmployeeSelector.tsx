'use client'

import { useState, useEffect, useActionState } from 'react'
import { Employee } from '@/lib/employee-actions'
import styles from './employee-selector.module.css'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EmployeeSelectorProps {
  employees: Employee[]
  currentBindingId?: number
  onSubmit: (prevState: any, formData: FormData) => Promise<void>
}

export function EmployeeSelector({ employees, currentBindingId, onSubmit }: EmployeeSelectorProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(currentBindingId)
  const [, formAction, isPending] = useActionState(onSubmit, null)

  console.log({currentBindingId,selectedEmployeeId})

  // 同步 currentBindingId 的变化
  useEffect(() => {
    setSelectedEmployeeId(currentBindingId)
  }, [currentBindingId])

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId)

  return (
    <div className={styles.formSection}>
      <h3>{currentBindingId ? 'Change Employee Profile' : 'Select Your Employee Profile'}</h3>
      <form action={formAction}>
        <div className={styles.formGroup}>
          <label>Choose Employee</label>
          <Select 
            name="employeeId"
            value={selectedEmployeeId ? String(selectedEmployeeId) : ''} 
            onValueChange={(value) => setSelectedEmployeeId(value ? parseInt(value) : undefined)}
            required
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="-- Select Employee --" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={String(emp.id)}>
                  {emp.employee_code} - {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Hidden input to submit form data */}
          <input type="hidden" name="employeeId" value={selectedEmployeeId || ''} />
        </div>

        {selectedEmployee && (
          <div className={styles.profileInfo}>
            <h4>Profile Details</h4>
            <div className={styles.profileGrid}>
              <div>
                <label>Employee Code</label>
                <input 
                  type="text" 
                  value={selectedEmployee.employee_code} 
                  disabled 
                />
              </div>
              <div>
                <label>Staff Name</label>
                <input 
                  type="text" 
                  value={selectedEmployee.name} 
                  disabled 
                />
              </div>
              <div>
                <label>Department</label>
                <input 
                  type="text" 
                  value={selectedEmployee.department} 
                  disabled 
                />
              </div>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button 
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary} ${isPending ? styles.loading : ''}`}
            disabled={!selectedEmployeeId || isPending}
          >
            {isPending ? 'Binding...' : (currentBindingId ? 'Update Binding' : 'Confirm Binding')}
          </button>
        </div>
      </form>
    </div>
  )
}