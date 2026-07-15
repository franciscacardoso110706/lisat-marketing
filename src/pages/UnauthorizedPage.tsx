import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { pt } from '@/i18n/pt'

export function UnauthorizedPage() {
  const { session, member, signOut } = useAuth()

  if (!session) return <Navigate to="/login" replace />
  if (member) return <Navigate to="/" replace />

  const email = session.user.email

  return (
    <div className="app-bg flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-pop">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-slate-800">{pt.auth.unauthorizedTitle}</h1>
        <p className="mt-2 text-sm text-slate-500">{pt.auth.unauthorizedBody}</p>
        <div className="my-4 rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm text-slate-700">
          {email}
        </div>
        <p className="mb-6 text-xs text-slate-400">{pt.auth.unauthorizedHint}</p>
        <Button variant="secondary" block onClick={signOut}>
          {pt.common.signOut}
        </Button>
      </div>
    </div>
  )
}
