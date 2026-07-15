import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Member, Role } from '@/types/database'

interface AuthState {
  session: Session | null
  member: Member | null
  role: Role | null
  loading: boolean
  /** Sessão Google iniciada, mas o email não está na lista de autorizados. */
  unauthorized: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshMember: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  // Vai buscar o membro correspondente ao email da sessão. Devolve null se o
  // email não estiver na lista de autorizados (as políticas RLS não deixam ler
  // nada nesse caso).
  async function loadMember(current: Session | null) {
    if (!current?.user?.email) {
      setMember(null)
      return
    }
    // Carimba o auth_user_id (para o diretório mostrar "ligado").
    try {
      await supabase.rpc('link_current_user')
    } catch {
      /* não é crítico para o acesso */
    }

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .ilike('email', current.user.email) // igualdade sem distinção de maiúsculas
      .maybeSingle()

    if (error) {
      console.error('Erro ao carregar o membro:', error.message)
      setMember(null)
      return
    }
    setMember((data as Member) ?? null)
  }

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadMember(data.session)
      if (active) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next)
      setLoading(true)
      await loadMember(next)
      setLoading(false)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      member,
      role: member?.role ?? null,
      loading,
      unauthorized: !!session && !member,
      signInWithGoogle: async () => {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        })
      },
      signOut: async () => {
        await supabase.auth.signOut()
        setMember(null)
      },
      refreshMember: () => loadMember(session),
    }),
    [session, member, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth tem de ser usado dentro de <AuthProvider>')
  return ctx
}
