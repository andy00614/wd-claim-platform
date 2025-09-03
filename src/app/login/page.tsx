'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getUrl } from '@/utils/environments'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user is already logged in
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        router.push('/binding') // Redirect to employee binding
      }
    }
    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.push('/binding')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    const redirectTo = new URL("/auth/callback", getUrl());

    console.log('redirectTo',redirectTo)

    redirectTo.searchParams.append("provider", "google");
    redirectTo.searchParams.append("client", "desktop");
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo.toString(),
          queryParams: {
            prompt: "select_account",
            client: "desktop",
          },
        },
      })
      
      if (error) throw error
    } catch (error: any) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (user) {
    return (
      <div className="login-container">
        <div className="header">
          <h1>Wild Dynasty Pte Ltd</h1>
          <h2>Expense Claim System</h2>
        </div>
        
        <div className="user-info">
          <p>Welcome back!</p>
          <p className="user-email">{user.email}</p>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
        
        <style jsx>{`
          .user-info {
            text-align: center;
            padding: 24px;
            border: 1px solid #cccccc;
          }
          .user-email {
            color: #666666;
            margin: 12px 0;
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <div className="login-container">
        <div className="header">
          <h1>Wild Dynasty Pte Ltd</h1>
          <h2>Expense Claim System with AI Assistant</h2>
        </div>
        
        <button 
          className={`google-signin ${loading ? 'loading' : ''}`}
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        
        {error && (
          <div className="error-message">
            <p>Login failed: {error}</p>
          </div>
        )}
        
        <div className="feature-list">
          <h3>System Features</h3>
          <ul>
            <li>Submit expense claims online</li>
            <li>AI-powered expense entry assistance</li>
            <li>Voice input for quick expense recording</li>
            <li>Image recognition for receipts</li>
            <li>Track claim history and status</li>
            <li>Export to CSV for accounting</li>
          </ul>
        </div>
      </div>

      <style jsx global>{`
        :root {
          --color-black: #000000;
          --color-white: #ffffff;
          --color-gray-50: #f5f5f5;
          --color-gray-100: #e6e6e6;
          --color-gray-200: #cccccc;
          --color-gray-300: #b3b3b3;
          --color-gray-400: #999999;
          --color-gray-500: #808080;
          --color-gray-600: #666666;
          --color-gray-700: #4d4d4d;
          --color-gray-800: #333333;
          --color-gray-900: #1a1a1a;
          --color-ai-blue: #0066cc;
          --color-ai-light: #e6f2ff;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
          font-size: 13px;
          line-height: 1.4;
          color: var(--color-black);
          background: var(--color-white);
        }

        .login-container {
          text-align: center;
          padding: 36px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 48px;
          max-width: 600px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          border: 2px solid var(--color-black);
          padding: 24px;
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

        .google-signin {
          display: inline-block;
          background: var(--color-black);
          color: var(--color-white);
          padding: 18px 36px;
          font-size: 15px;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .google-signin:hover:not(:disabled) {
          background: var(--color-gray-800);
        }

        .google-signin:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .google-signin.loading {
          background: var(--color-gray-600);
        }

        .btn {
          display: inline-block;
          padding: 6px 12px;
          font-size: 11px;
          border: 1px solid var(--color-black);
          background: var(--color-white);
          color: var(--color-black);
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
          font-family: inherit;
        }

        .btn:hover {
          background: var(--color-gray-50);
        }

        .btn-secondary {
          background: var(--color-gray-100);
          border-color: var(--color-gray-300);
        }

        .error-message {
          background: #ffebee;
          border: 1px solid #f44336;
          color: #d32f2f;
          padding: 12px;
          border-radius: 4px;
          max-width: 400px;
        }

        .feature-list {
          border: 1px solid var(--color-gray-300);
          padding: 24px;
          max-width: 500px;
        }

        .feature-list h3 {
          font-size: 13px;
          margin-bottom: 18px;
          font-weight: 600;
        }

        .feature-list ul {
          list-style: none;
          text-align: left;
        }

        .feature-list li {
          margin-bottom: 6px;
          font-size: 11px;
          position: relative;
          padding-left: 12px;
        }

        .feature-list li:before {
          content: "•";
          margin-right: 6px;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
      `}</style>
    </>
  )
}