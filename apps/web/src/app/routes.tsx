// apps/web/src/app/routes.tsx
import { Route, Routes, Navigate } from 'react-router-dom';
import PublicList from '../features/public/PublicList';
import ListLinks from '../features/admin/ListLinks';
import CreateLink from '../features/admin/CreateLink';
import EditLink from '../features/admin/EditLink';
import DevLogin from '../features/admin/DevLogin';
import Protected from './Protected';
import AdminLayout from './AdminLayout';
import AdminTools from '../features/admin/Tools';

export function AppRoutes() {
  return (
    <Routes>
      {/* PÚBLICO */}
      <Route path="/" element={<PublicList />} />

      {/* LOGIN DEV (local) */}
      <Route path="/admin/dev-login" element={<DevLogin />} />

      {/* ADMIN (layout con TopBar) */}
      <Route path="/admin" element={<AdminLayout />}>
      <Route path="links" element={<Protected><ListLinks /></Protected>} />
      <Route path="create" element={<Protected><CreateLink /></Protected>} />
      <Route path="edit/:slug" element={<Protected><EditLink /></Protected>} />
      <Route path="tools" element={<Protected><AdminTools /></Protected>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
