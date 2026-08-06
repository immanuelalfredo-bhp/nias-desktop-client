import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { system } from '@nias/shared';
import type { AuthenticatedRouteState } from '../../types.js';
import { notifyApp } from '../../lib/notifications';
import UserModal from '../../pages/system/users/UserModal';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isSelfModalOpen, setIsSelfModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<system.User | null>(null);
  const [updateState, setUpdateState] = useState<'idle' | 'checking' | 'available' | 'not-available' | 'progress' | 'downloaded' | 'error'>('idle');
  const [updateProgress, setUpdateProgress] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleOpenSelfEdit = async () => {
    setIsUserMenuOpen(false);
    setIsBusy(true);
    try {
      const result = await window.electronAPI.userGetSelf();
      if (!result.success) {
        notifyApp(`Failed to load profile: ${result.message || 'Unknown error'}`, 'error');
        return;
      }

      setCurrentUser(result.data ?? null);
      setIsSelfModalOpen(true);
    } catch (error) {
      console.error('Failed to load current user:', error);
      notifyApp('Failed to load profile.', 'error');
    } finally {
      setIsBusy(false);
    }
  };

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
      const versionResult = await window.electronAPI.syncRun();

      if (!versionResult.success) {
        console.error('Sync failed:', versionResult.message);
        notifyApp(`Sync failed: ${versionResult.message || 'Unknown error'}`, 'error');
        return;
      }

      const changeCount = Object.values(versionResult.data?.changes || {}).reduce(
        (acc: number, changes: unknown) => acc + (Array.isArray(changes) ? changes.length : 0),
        0,
      );

      console.log(`Sync completed successfully. Total changes: ${changeCount}`);
      notifyApp(`Sync completed successfully! Total changes: ${changeCount}`, 'success');
    } catch (error) {
      console.error('Error during sync:', error);
      notifyApp('An unexpected error occurred during sync.', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    const removeListener = window.electronAPI.onUpdateStatus((payload: any) => {
      setUpdateState(payload.status);
      if (payload.status === 'progress') {
        setUpdateProgress(payload.progress.percent ?? null);
      }
      if (payload.status === 'available') {
        notifyApp('Update available. Click the arrow to download.', 'info');
      }
      if (payload.status === 'not-available') {
        notifyApp('No updates available.', 'info');
      }
      if (payload.status === 'downloaded') {
        notifyApp('Update downloaded. Restart to install.', 'success');
      }
      if (payload.status === 'error') {
        notifyApp(`Update error: ${payload.error}`, 'error');
      }
    });

    return () => removeListener();
  }, []);

  const handleCheckForUpdates = async () => {
    setIsBusy(true);
    setUpdateState('checking');

    try {
      const result = await window.electronAPI.checkForUpdates();
      if (!result.success) {
        notifyApp(`Update check failed: ${result.message || 'Unknown error'}`, 'error');
        setUpdateState('error');
      }
    } catch (error) {
      console.error('Update check failed:', error);
      notifyApp('Update check failed.', 'error');
      setUpdateState('error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDownloadUpdate = async () => {
    setIsBusy(true);
    try {
      const result = await window.electronAPI.downloadUpdate();
      if (!result.success) {
        notifyApp(`Download failed: ${result.message || 'Unknown error'}`, 'error');
        setUpdateState('error');
      }
    } catch (error) {
      console.error('Download update failed:', error);
      notifyApp('Download update failed.', 'error');
      setUpdateState('error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleInstallUpdate = async () => {
    await window.electronAPI.quitAndInstall();
  };

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h2>{title}</h2>
      </div>

      <div className="topbar-actions">
        {/* Update Button */}
        <button
          className="icon-btn"
          title="Check for updates"
          onClick={handleCheckForUpdates}
          disabled={isBusy}
        >
          ⬇️
        </button>
        {updateState === 'available' && (
          <button
            className="icon-btn"
            title="Download update"
            onClick={handleDownloadUpdate}
            disabled={isBusy}
          >
            ⬳
          </button>
        )}
        {updateState === 'downloaded' && (
          <button
            className="icon-btn"
            title="Install update and restart"
            onClick={handleInstallUpdate}
            disabled={isBusy}
          >
            🔁
          </button>
        )}
        {/* Sync Button */}
        <button className="icon-btn" title="Sync Database" onClick={handleSync} disabled={isBusy}>
          🔄
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
              <button onClick={() => void handleOpenSelfEdit()} disabled={isBusy}>✏️ Edit Self</button>
              <hr style={{ margin: '4px 0', borderColor: 'var(--line)' }} />
              <button onClick={handleLogout} className="danger-text">
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <UserModal
        isOpen={isSelfModalOpen}
        onClose={() => setIsSelfModalOpen(false)}
        onSuccess={(message) => {
          notifyApp(message, 'success');
          setIsSelfModalOpen(false);
        }}
        userToEdit={currentUser}
        isSelfEdit
      />
    </header>
  );
}
