import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';

export default function AdminLayout() {
  return (
    <>
      <TopBar />   {/* ← solo para admin */}
      <Outlet />
    </>
  );
}
