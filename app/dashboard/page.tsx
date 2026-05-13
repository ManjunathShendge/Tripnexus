'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/client'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (!data?.user) {
        router.push('/auth/login')
        return
      }

      setUser(data.user)
      setLoading(false)
    }

    fetchUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="rounded-3xl bg-white p-8 shadow-lg text-center">
          <p className="text-slate-700">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="rounded-3xl bg-white p-8 shadow-lg text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-4">Error</h1>
          <p className="text-slate-700">{error}</p>
          <Link href="/auth/login" className="mt-4 inline-block rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white border border-slate-200 p-10 shadow-lg">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Welcome, {user?.email}</h1>
        <p className="text-slate-600 mb-8">This is your protected dashboard. You&apos;re successfully authenticated with Supabase.</p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold mb-2">Account</h2>
            <p className="text-slate-700 mb-1"><strong>Email:</strong> {user?.email}</p>
            <p className="text-slate-700"><strong>User ID:</strong> {user?.id}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold mb-2">Next step</h2>
            <p className="text-slate-700">Build your restaurant or ordering pages next.</p>
            <Link href="/" className="mt-4 inline-flex rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
