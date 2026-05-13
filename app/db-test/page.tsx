'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'

type TableRow = {
  table_name: string
}

export default function DatabaseTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [tables, setTables] = useState<TableRow[]>([])

  useEffect(() => {
    async function testDatabase() {
      try {
        const supabase = createClient()

        // Test database connection by trying to query a simple table
        // First try to get a count of users (should work even if empty)
        const { count, error } = await supabase
          .from('User')
          .select('*', { count: 'exact', head: true })

        if (error) {
          // If that fails, try a different approach - just check if we can connect
          console.log('Error details:', error)
          throw error
        }

        setStatus('success')
        setMessage(`✅ Database connection successful! Found ${count || 0} users in database.`)
        setTables([])
      } catch (error) {
        console.error('Database test error:', error)
        setStatus('error')
        setMessage(`❌ Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    testDatabase()
  }, [])

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Database Test</h1>

      <div className={`p-4 rounded-lg mb-6 ${
        status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
        status === 'success' ? 'bg-green-100 text-green-800' :
        'bg-red-100 text-red-800'
      }`}>
        {status === 'loading' && '🔄 Testing database connection...'}
        {status === 'success' && message}
        {status === 'error' && message}
      </div>

      {tables.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Sample Tables Found:</h2>
          <ul className="list-disc list-inside">
            {tables.map((table, index) => (
              <li key={index} className="text-gray-700">{table.table_name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Note:</strong> This test verifies your Supabase database connection.</p>
        <p>If successful, you can now use Supabase for:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Authentication (sign up, sign in, sign out)</li>
          <li>Database queries and mutations</li>
          <li>Real-time subscriptions</li>
          <li>File storage</li>
        </ul>
      </div>
    </div>
  )
}
