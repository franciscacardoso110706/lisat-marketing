import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Layout } from '@/components/Layout'
import { FullPageSpinner } from '@/components/ui/Spinner'

/**
 * Envolve todas as páginas que exigem sessão iniciada + membro autorizado.
 * - A carregar → spinner
 * - Sem sessão → vai para /login
 * - Com sessão mas email não autorizado → vai para /nao-autorizado
 * - Autorizado → mostra o Layout (com a navegação por papel)
 */
export function ProtectedLayout() {
  const { loading, session, member } = useAuth()

  if (loading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" replace />
  if (!member) return <Navigate to="/nao-autorizado" replace />

  return <Layout />
}
