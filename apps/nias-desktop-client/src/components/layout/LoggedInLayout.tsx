import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { AuthenticatedRouteState } from '../../types.js';
import AppHeader from './AppHeader';
import LeftNavbar from './LeftNavbar';

const STORAGE_KEY = 'nias.currentEmail';

function readStoredEmail(): string {
  return window.localStorage.getItem(STORAGE_KEY) ?? '';
}

function normalizeEmail(candidate: unknown): string {
  return typeof candidate === 'string' ? candidate.trim() : '';
}

export default function LoggedInLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = location.state as AuthenticatedRouteState | null;

  const fromState = normalizeEmail(routeState?.email);
  const fromStorage = normalizeEmail(readStoredEmail());
  const email = fromState || fromStorage;

  if (!email) {
    return <Navigate to="/login" replace />;
  }

  if (fromState && fromState !== fromStorage) {
    window.localStorage.setItem(STORAGE_KEY, fromState);
  }

  const handleLogout = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    navigate('/login', {
      replace: true,
      state: { message: 'Logged out successfully.' } satisfies AuthenticatedRouteState,
    });
  };

  const handleSettingsClick = () => {
    // Placeholder action until settings page is implemented.
    window.alert('Settings page will be added here.');
  };

  return (
    <div id="app" className="app-shell">
      <AppHeader
        email={email}
        onSettingsClick={handleSettingsClick}
        onLogoutClick={handleLogout}
      />
      <div className="app-body">
        <LeftNavbar />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
