import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedLayout } from '@/components/ProtectedRoute'
import { RoleGate } from '@/components/RoleGate'
import { LoginPage } from '@/pages/LoginPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TeamPage } from '@/pages/TeamPage'
import { TasksPage } from '@/pages/TasksPage'
import { MyTasksPage } from '@/pages/MyTasksPage'
import { ApprovalsPage } from '@/pages/ApprovalsPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { LinksPage } from '@/pages/LinksPage'
import { SponsorsPage } from '@/pages/SponsorsPage'

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/nao-autorizado" element={<UnauthorizedPage />} />

      {/* Protegidas (exigem sessão + membro autorizado) */}
      <Route element={<ProtectedLayout />}>
        <Route index element={<DashboardPage />} />

        {/* Líder */}
        <Route
          path="tarefas"
          element={
            <RoleGate roles={['leader']}>
              <TasksPage />
            </RoleGate>
          }
        />
        <Route
          path="aprovacoes"
          element={
            <RoleGate roles={['leader']}>
              <ApprovalsPage />
            </RoleGate>
          }
        />
        <Route
          path="equipa"
          element={
            <RoleGate roles={['leader']}>
              <TeamPage />
            </RoleGate>
          }
        />

        {/* Membro */}
        <Route
          path="minhas-tarefas"
          element={
            <RoleGate roles={['member']}>
              <MyTasksPage />
            </RoleGate>
          }
        />

        {/* Ambos */}
        <Route path="calendario" element={<CalendarPage />} />
        <Route path="links" element={<LinksPage />} />
        <Route path="sponsors" element={<SponsorsPage />} />
      </Route>

      {/* Qualquer outra rota → início */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
