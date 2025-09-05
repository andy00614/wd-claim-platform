'use client'

import { useState, useEffect, useTransition } from 'react'
import { Employee } from '@/lib/employee-actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface EmployeeSelectorProps {
  employees: Employee[]
  currentBindingId?: number
  onSubmit: (prevState: any, formData: FormData) => Promise<void>
}

export function EmployeeSelector({ employees, currentBindingId, onSubmit }: EmployeeSelectorProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(currentBindingId)
  const [isPending, startTransition] = useTransition()

  console.log({currentBindingId,selectedEmployeeId})

  // 同步 currentBindingId 的变化
  useEffect(() => {
    setSelectedEmployeeId(currentBindingId)
  }, [currentBindingId])

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId)

  const handleClick = () => {
    if (selectedEmployeeId) {
      const formData = new FormData()
      formData.append('employeeId', String(selectedEmployeeId))
      console.log('按钮点击，employeeId:', formData.get('employeeId'))
      
      startTransition(async () => {
        await onSubmit(null, formData)
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          {currentBindingId ? 'Change Employee Profile' : 'Select Your Employee Profile'}
        </CardTitle>
        <div className="border-b border-gray-200"></div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="space-y-2">
            <Label htmlFor="employeeId" className="text-xs font-semibold">
              Choose Employee
            </Label>
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
          </div>

          {selectedEmployee && (
            <Card className="bg-gray-50 border border-gray-200 mt-4">
              <CardHeader>
                <CardTitle className="text-xs">Profile Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">Employee Code</Label>
                    <Input 
                      value={selectedEmployee.employee_code} 
                      disabled
                      className="bg-gray-50 text-gray-500 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Staff Name</Label>
                    <Input 
                      value={selectedEmployee.name} 
                      disabled
                      className="bg-gray-50 text-gray-500 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs font-semibold">Department</Label>
                    <Input 
                      value={selectedEmployee.department} 
                      disabled
                      className="bg-gray-50 text-gray-500 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center mt-6">
            <Button 
              type="button"
              onClick={handleClick}
              disabled={!selectedEmployeeId || isPending}
              className="bg-black text-white hover:bg-gray-800 px-6 py-3 text-sm"
            >
              {isPending ? 'Binding...' : (currentBindingId ? 'Update Binding' : 'Confirm Binding')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}