import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { Icon } from '@/components/ui/Icon'
import { pt } from '@/i18n/pt'

export function LoginPage() {
  const { session, member, loading, unauthorized, signInWithGoogle } = useAuth()
  const [signingIn, setSigningIn] = useState(false)

  if (loading) return <FullPageSpinner />
  if (session && member) return <Navigate to="/" replace />
  if (unauthorized) return <Navigate to="/nao-autorizado" replace />

  return (
    <div className="app-bg flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-pop">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-glow">
            <Icon name="satellite" size={28} />
          </span>
          <div className="text-xl font-extrabold tracking-tight text-slate-800">
            LISAT · Marketing
          </div>
          <p className="mt-1 text-sm text-slate-500">{pt.auth.signInSubtitle}</p>
        </div>

        <Button
          block
          variant="secondary"
          disabled={signingIn}
          onClick={async () => {
            setSigningIn(true)
            try {
              await signInWithGoogle()
            } finally {
              setSigningIn(false)
            }
          }}
        >
          <GoogleIcon />
          {signingIn ? pt.auth.signingIn : pt.auth.signInWithGoogle}
        </Button>

        <p className="mt-6 text-center text-xs text-slate-400">
          Só entram membros autorizados pelo líder do departamento.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}
