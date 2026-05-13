'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'

export default function SupabaseTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient()

        // Test basic connection by trying to get the current user
        const { error } = await supabase.auth.getUser()

        if (error && error.message !== 'Auth session missing!') {
          throw error
        }

        setStatus('success')
        setMessage('✅ Supabase connection successful! Auth service is working.')
      } catch (error) {
        setStatus('error')
        setMessage(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>

      <div className={`p-4 rounded-lg ${
        status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
        status === 'success' ? 'bg-green-100 text-green-800' :
        'bg-red-100 text-red-800'
      }`}>
        {status === 'loading' && '🔄 Testing connection...'}
        {status === 'success' && message}
        {status === 'error' && message}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
        <p><strong>Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}</p>
      </div>
    </div>
  )
}
