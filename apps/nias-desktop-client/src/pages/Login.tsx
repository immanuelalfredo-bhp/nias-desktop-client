import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BootstrapModal from '../components/modals/BootstrapModal';
import type { LoginRouteState, StatusState } from '../types/ui';
import { el } from 'zod/locales';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    text: '',
    isError: false,
  });
  const [isAuthEmpty, setIsAuthEmpty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const routeState = location.state as LoginRouteState | null;

    if (!routeState?.message) {
      return;
    }

    setStatus({ text: routeState.message, isError: false });
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await window.electronAPI.authStatus();
        setIsAuthEmpty(response.isEmpty);
      } catch (error) {
        console.error('Error checking auth database:', error);
      }
      };

    checkStatus();
  }, []);

  const handleLogin = async () => {
    setIsBusy(true);
    setStatus({ text: 'Logging in...', isError: false });

    try {
      const result = await window.electronAPI.authLogin({
        username: username, 
        password: password 
      });
      if (result.success) {
        const userResult = await window.electronAPI.authGetLocalUserIdByUsername(username);
        const initResult = await window.electronAPI.authInitializeDb(userResult.userId);
        if (initResult.success) {
          navigate('/dashboard');
          return;
        } else {
          setStatus({ 
            text: `Login succeeded but failed to initialize user database: ${initResult.message || 
              'Unknown error'}`, isError: true });
        }
        return;
      }

      setStatus({ text: 'Syncing account data...', isError: false });
      const userResult = await window.electronAPI.authFetchUser(username, password);
      const syncResult = await window.electronAPI.authSyncUsers();

      if (userResult.success && syncResult.success) {
        const retryLoginResult = await window.electronAPI.authLogin({
          username: username, 
          password: password 
        });

        if (retryLoginResult.success) {
          navigate('/dashboard');
          return;
        } else {
          setStatus({ text: `Sync succeeded but login failed: ${retryLoginResult.message || 'Unknown error'}`, isError: true });
        }
      } else {
        setStatus({ text: `Login failed and could not sync account data: ${userResult.message || 'Unknown error'}`, isError: true });
      }
    } catch (error) {
      setStatus({ text: `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`, isError: true });
    } finally {
      setIsBusy(false);
    }
  };
  const handleSync = async () => {
    setIsBusy(true);
    setStatus({ text: 'Syncing...', isError: false });
    try {
      const result = await window.electronAPI.authSyncUsers();
      if (result.success) {
        setStatus({ text: 'Sync successful', isError: false });
      } else {
        setStatus({ text: `Sync failed: ${result.message || 'Unknown error'}`, isError: true });
      }
    } catch (error) {
      setStatus({ text: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`, isError: true });
    } finally {
      setIsBusy(false);
    }
  }
  const handleBootstrap = () => {
    navigate('/bootstrap');
  };

  return (
    <div id="loginWrap" className="login-wrap">
      <section className="card login-card">
        <h1>Login</h1>
        <label htmlFor="username">Username</label>
          <input
            id="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

        <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

        <div className="actions">
          <button onClick={handleLogin} className="primary" disabled={isBusy}>
            Login
          </button>
          <button onClick={handleSync} className="secondary" disabled={isBusy}>
            Sync
          </button>
          {isAuthEmpty && (
            <button
              onClick={() => setShowModal(true)}
              className="secondary"
              disabled={isBusy}
            >
              Bootstrap
            </button>
          )}
        </div>
      <div className={status.isError ? 'status error' : 'status'}>
        {status.text}
      </div>
      </section>
      {showModal && (
        <BootstrapModal
          onClose={() => setShowModal(false)}
          onExecute={() => {
            handleBootstrap();
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}