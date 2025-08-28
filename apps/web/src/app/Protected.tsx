import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom';
import { getDevEmail, isLocalHost, safeNextFromLocation } from './auth';

export default function Protected({ children }: { children: ReactNode }) {
  const loc = useLocation();
  // Si ya estoy en la página de login, no redirijo
  if (loc.pathname.startsWith('/admin/dev-login')) return <>{children}</>;

  if (isLocalHost && !getDevEmail()) {
    const next = encodeURIComponent(safeNextFromLocation());
    return <Navigate to={`/admin/dev-login?next=${next}`} replace />;
  }
  return <>{children}</>
}
