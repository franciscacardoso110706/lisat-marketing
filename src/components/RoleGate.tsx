import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/types/database'

/**
 * Protege uma página por papel. Se o membro não tiver um papel permitido,
 * é reencaminhado para o início. (A segurança real está nas políticas RLS;
 * isto é apenas para a navegação não mostrar páginas que não interessam.)
 */
export function RoleGate({
  roles,
  children,
}: {
  roles: Role[]
  children: ReactNode
}) {
  const { member } = useAuth()
  if (member && roles.includes(member.role)) return <>{children}</>
  return <Navigate to="/" replace />
}
