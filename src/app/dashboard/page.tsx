'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [employee, setEmployee] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const employeeData = localStorage.getItem('currentEmployee')
      if (!employeeData) {
        router.push('/binding')
        return
      }

      setUser(user)
      setEmployee(JSON.parse(employeeData))
      setLoading(false)
    }
    getUser()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('currentEmployee')
    router.push('/login')
  }

  const handleChangeEmployee = () => {
    localStorage.removeItem('currentEmployee')
    router.push('/binding')
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

  if (!user || !employee) return null

  return (
    <>
      <div className="dashboard-container">
        <div className="header">
          <h1>Wild Dynasty Pte Ltd</h1>
          <h2>Expense Claim Dashboard</h2>
        </div>

        <div className="status-bar">
          <div>
            <span>Employee: <strong>{employee.name} ({employee.code})</strong></span>
            <span className="department">Department: {employee.department}</span>
          </div>
          <div className="actions">
            <button className="btn" onClick={handleChangeEmployee}>
              Change Employee
            </button>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="content">
          <div className="welcome-card">
            <h3>Welcome to the Expense Claim System</h3>
            <p>Your authentication system is now working! 🎉</p>
            <p>Next steps:</p>
            <ul>
              <li>Create expense claim forms</li>
              <li>Add AI assistant integration</li>
              <li>Implement file uploads</li>
              <li>Build reporting features</li>
            </ul>
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button className="btn btn-primary" disabled>
                + New Expense Claim
              </button>
              <button className="btn" disabled>
                View History
              </button>
              <button className="btn" disabled>
                Export Reports
              </button>
            </div>
            <p className="note">These features will be implemented in the next steps.</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
          font-size: 13px;
          line-height: 1.4;
          color: #000000;
          background: #ffffff;
        }

        .dashboard-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 24px;
          min-height: 100vh;
        }

        .header {
          text-align: center;
          border: 2px solid #000000;
          padding: 24px;
          margin-bottom: 24px;
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

        .status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px;
          border: 1px solid #cccccc;
          background: #f5f5f5;
          margin-bottom: 24px;
        }

        .status-bar .department {
          display: block;
          font-size: 10px;
          color: #666666;
          margin-top: 3px;
        }

        .status-bar .actions {
          display: flex;
          gap: 9px;
        }

        .content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        .welcome-card, .quick-actions {
          border: 1px solid #cccccc;
          padding: 24px;
        }

        .welcome-card h3, .quick-actions h3 {
          font-size: 15px;
          margin-bottom: 12px;
          font-weight: 600;
        }

        .welcome-card p {
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .welcome-card ul {
          margin-left: 18px;
          margin-bottom: 12px;
        }

        .welcome-card li {
          margin-bottom: 6px;
          font-size: 11px;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-bottom: 12px;
        }

        .action-buttons .btn {
          text-align: left;
          padding: 9px 12px;
        }

        .note {
          font-size: 10px;
          color: #666666;
          font-style: italic;
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

        .btn:hover:not(:disabled) {
          background: #f5f5f5;
        }

        .btn-primary {
          background: #000000;
          color: #ffffff;
        }

        .btn-primary:hover:not(:disabled) {
          background: #333333;
        }

        .btn-secondary {
          background: #e6e6e6;
          border-color: #cccccc;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f5f5f5;
          color: #999999;
        }

        @media (max-width: 768px) {
          .content {
            grid-template-columns: 1fr;
          }
          
          .status-bar {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  )
}