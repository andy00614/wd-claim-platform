'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Mock employee data (will move to database later)
const employees = {
  'EMP001': { name: 'Andy Zhang', department: 'Finance & Accounting', email: 'andy.zhang@wilddynasty.com' },
  'EMP002': { name: 'Lucas Zhao', department: 'Human Resources', email: 'lucas.zhao@wilddynasty.com' },
  'EMP003': { name: 'Celine Chiong', department: 'IT Department', email: 'celine.chiong@wilddynasty.com' },
  'EMP004': { name: 'Eve Li', department: 'Marketing', email: 'eve.li@wilddynasty.com' }
}

export default function EmployeeBindingPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [binding, setBinding] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        setLoading(false)
      }
    }
    getUser()
  }, [router, supabase])

  const handleEmployeeChange = (empCode: string) => {
    setSelectedEmployee(empCode)
  }

  const handleBinding = async () => {
    if (!selectedEmployee) {
      alert('Please select an employee profile.')
      return
    }

    setBinding(true)
    
    // For now, store in localStorage (later will save to database)
    const employeeData = {
      code: selectedEmployee,
      ...employees[selectedEmployee as keyof typeof employees]
    }
    
    localStorage.setItem('currentEmployee', JSON.stringify(employeeData))
    
    // Simulate binding process
    setTimeout(() => {
      alert('Employee binding successful!')
      router.push('/dashboard')
    }, 1000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
        
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 12px;
          }
          .loading-spinner {
            width: 24px;
            height: 24px;
            border: 2px solid #cccccc;
            border-top: 2px solid #000000;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <div className="binding-container">
        <div className="header">
          <h1>Wild Dynasty Pte Ltd</h1>
          <h2>Employee Profile Binding</h2>
        </div>

        <div className="user-info">
          <p>Logged in as: <strong>{user.email}</strong></p>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="form-section">
          <h3>Select Your Employee Profile</h3>
          
          <div className="form-group">
            <label>Choose Employee</label>
            <select 
              value={selectedEmployee} 
              onChange={(e) => handleEmployeeChange(e.target.value)}
            >
              <option value="">-- Select Employee --</option>
              {Object.entries(employees).map(([code, emp]) => (
                <option key={code} value={code}>
                  {code} - {emp.name}
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (
            <div className="profile-info">
              <h4>Profile Details</h4>
              <div className="profile-grid">
                <div>
                  <label>Employee Code</label>
                  <input type="text" value={selectedEmployee} disabled />
                </div>
                <div>
                  <label>Staff Name</label>
                  <input 
                    type="text" 
                    value={employees[selectedEmployee as keyof typeof employees]?.name || ''} 
                    disabled 
                  />
                </div>
                <div>
                  <label>Department</label>
                  <input 
                    type="text" 
                    value={employees[selectedEmployee as keyof typeof employees]?.department || ''} 
                    disabled 
                  />
                </div>
                <div>
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={employees[selectedEmployee as keyof typeof employees]?.email || ''} 
                    disabled 
                  />
                </div>
              </div>
            </div>
          )}

          <div className="actions">
            <button 
              className={`btn btn-primary ${binding ? 'loading' : ''}`}
              onClick={handleBinding}
              disabled={!selectedEmployee || binding}
            >
              {binding ? 'Binding...' : 'Confirm Binding'}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .binding-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
          min-height: 100vh;
        }

        .header {
          text-align: center;
          border: 2px solid #000000;
          padding: 24px;
          margin-bottom: 36px;
        }

        .header h1 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .header h2 {
          font-size: 13px;
          font-weight: 400;
        }

        .user-info {
          background: #f5f5f5;
          border: 1px solid #cccccc;
          padding: 18px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .form-section {
          border: 1px solid #cccccc;
          padding: 24px;
          margin-bottom: 24px;
        }

        .form-section h3 {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 18px;
          padding-bottom: 6px;
          border-bottom: 1px solid #e6e6e6;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-group label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .form-group select {
          width: 100%;
          padding: 6px 9px;
          font-size: 11px;
          border: 1px solid #cccccc;
          background: #ffffff;
          font-family: inherit;
        }

        .profile-info {
          background: #f5f5f5;
          border: 1px solid #cccccc;
          padding: 18px;
          margin: 18px 0;
        }

        .profile-info h4 {
          font-size: 11px;
          margin-bottom: 18px;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .profile-grid label {
          display: block;
          font-size: 10px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .profile-grid input {
          width: 100%;
          padding: 6px 9px;
          font-size: 11px;
          border: 1px solid #cccccc;
          background: #f5f5f5;
          color: #808080;
          font-family: inherit;
        }

        .actions {
          text-align: center;
          margin-top: 24px;
        }

        .btn-primary {
          background: #000000;
          color: #ffffff;
          padding: 12px 24px;
          font-size: 13px;
        }

        .btn-primary:hover:not(:disabled) {
          background: #333333;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary.loading {
          background: #666666;
        }

        .btn {
          display: inline-block;
          padding: 6px 12px;
          font-size: 11px;
          border: 1px solid #000000;
          background: #ffffff;
          color: #000000;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
          font-family: inherit;
        }

        .btn:hover {
          background: #f5f5f5;
        }

        .btn-secondary {
          background: #e6e6e6;
          border-color: #cccccc;
        }
      `}</style>
    </>
  )
}