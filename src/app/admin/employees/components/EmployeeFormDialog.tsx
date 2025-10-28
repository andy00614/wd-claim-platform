'use client'

import { useActionState, useEffect, useState } from 'react'
import { createEmployee, updateEmployee } from '@/lib/actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Employee {
  id: number
  name: string
  email: string
  employeeCode: number
  departmentEnum: string
  role: string
}

interface EmployeeFormDialogProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  employee?: Employee
}

const departments = [
  'Director',
  'HR Department',
  'Account Department',
  'Marketing Department',
  'Tech Department',
  'Knowledge Management'
]

export default function EmployeeFormDialog({ isOpen, onClose, mode, employee }: EmployeeFormDialogProps) {
  const isCustomInitial = employee?.departmentEnum ? !departments.includes(employee.departmentEnum) : false

  const [department, setDepartment] = useState(
    isCustomInitial ? 'custom' : (employee?.departmentEnum || '')
  )
  const [isCustomDepartment, setIsCustomDepartment] = useState(isCustomInitial)
  const [customDepartment, setCustomDepartment] = useState(
    isCustomInitial ? employee?.departmentEnum || '' : ''
  )
  const [role, setRole] = useState(employee?.role || 'employee')

  const updateAction = mode === 'edit' && employee ? updateEmployee.bind(null, employee.id) : createEmployee
  const [state, formAction] = useActionState(updateAction, { success: false, error: '' })

  useEffect(() => {
    if (state.success) {
      toast.success(mode === 'create' ? 'Employee created successfully' : 'Employee updated successfully')
      onClose()
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } else if (state.error) {
      toast.error(state.error)
    }
  }, [state.success, state.error, mode, onClose])

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setDepartment('')
      setIsCustomDepartment(false)
      setCustomDepartment('')
      setRole('employee')
    }
  }, [isOpen])

  useEffect(() => {
    if (employee) {
      const isCustom = !departments.includes(employee.departmentEnum)
      setIsCustomDepartment(isCustom)
      if (isCustom) {
        setCustomDepartment(employee.departmentEnum)
        setDepartment('custom')
      } else {
        setDepartment(employee.departmentEnum)
        setCustomDepartment('')
      }
      setRole(employee.role)
    }
  }, [employee])

  const handleDepartmentChange = (value: string) => {
    setDepartment(value)
    if (value === 'custom') {
      setIsCustomDepartment(true)
    } else {
      setIsCustomDepartment(false)
      setCustomDepartment('')
    }
  }

  const handleSubmit = (formData: FormData) => {
    const finalDepartment = isCustomDepartment ? customDepartment : department
    formData.set('department', finalDepartment)
    formData.set('role', role)
    formAction(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New Employee' : 'Edit Employee'}</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={employee?.name || ''}
              placeholder="Full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={employee?.email || ''}
              placeholder="email@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employeeCode">Employee Code *</Label>
            <Input
              id="employeeCode"
              name="employeeCode"
              type="number"
              defaultValue={employee?.employeeCode || ''}
              placeholder="e.g., 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Select value={department} onValueChange={handleDepartmentChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
                <SelectItem value="custom">
                  <span className="text-primary font-medium">+ Custom Department...</span>
                </SelectItem>
              </SelectContent>
            </Select>

            {isCustomDepartment && (
              <Input
                id="customDepartment"
                name="customDepartment"
                value={customDepartment}
                onChange={(e) => setCustomDepartment(e.target.value)}
                placeholder="Enter custom department name"
                className="mt-2"
                required
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Create' : 'Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
