import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthenticatedRouteState } from '../../types.js';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await window.electronAPI.authLogout();
    } finally {
      navigate('/login', {
        replace: true,
        state: { message: 'Logged out successfully.' } satisfies AuthenticatedRouteState,
      });
    }
  };

  const handleSync = async () => {
    setIsBusy(true);
    try {
      const versionResult = await window.electronAPI.syncPull();
      if (!versionResult.success) {
        console.error('Sync pull failed:', versionResult.message);
        return;
      }

      const changeCount = Object.values(versionResult.data?.changes || {}).reduce(
        (acc: number, changes: unknown) => acc + (Array.isArray(changes) ? changes.length : 0),
        0,
      );
      console.log(`Sync pull completed successfully. Total changes: ${changeCount}`);
    } catch (error) {
      console.error('Error during sync pull:', error);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h2>{title}</h2>
      </div>

      <div className="topbar-actions">
        {/* Sync Button */}
        <button className="icon-btn" title="Sync Database" onClick={handleSync} disabled={isBusy}>
          🔄
        </button>

        {/* Connection Status (Online) */}
        <button className="icon-btn" title="Connected">
          🌐
        </button>

        {/* User Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn user-avatar"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            title="User Profile"
          >
            👤
          </button>

          {isUserMenuOpen && (
            <div className="user-dropdown">
              <button onClick={() => setIsUserMenuOpen(false)}>⚙️ Settings</button>
              <hr style={{ margin: '4px 0', borderColor: 'var(--line)' }} />
              <button onClick={handleLogout} className="danger-text">
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
