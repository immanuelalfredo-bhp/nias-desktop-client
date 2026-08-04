import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { LoginRouteState, StatusState } from '../../types';
import BootstrapModal from './BootstrapModal';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    text: '',
    isError: false,
  });
  const [isAuthEmpty, setIsAuthEmpty] = useState(false);
  const [isBootstrapOpen, setIsBootstrapOpen] = useState(false);

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

        if (!response.success) {
          setStatus({
            text: `Error checking auth database: ${response.message || 'Unknown error'}`,
            isError: true,
          });
          return;
        }
        if (response.data.isEmpty) {
          setIsAuthEmpty(true);
          setStatus({ text: 'Auth database is empty.', isError: false });
        }
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
        email,
        password,
      });

      if (result.success) {
        navigate('/brands', { replace: true });
        return;
      }

      setStatus({ text: `Login failed: ${result.message || 'Unknown error'}`, isError: true });
    } catch (error) {
      setStatus({
        text: `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isError: true,
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleSync = async () => {
    setIsBusy(true);
    setStatus({ text: 'Syncing...', isError: false });
    try {
      const result = await window.electronAPI.authSync();
      if (result.success) {
        setStatus({ text: 'Sync successful', isError: false });
      } else {
        setStatus({ text: `Sync failed: ${result.message || 'Unknown error'}`, isError: true });
      }
    } catch (error) {
      setStatus({
        text: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isError: true,
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleBootstrap = async () => {
    setIsBusy(true);
    setStatus({ text: 'Verifying...', isError: false });

    try {
      const result = await window.electronAPI.bootstrapStatus();

      if (!result.success) {
        setStatus({
          text: `Bootstrap failed: ${result.message || 'Unknown error'}`,
          isError: true,
        });
        return;
      }
      if (result.data.isEmpty) {
        setIsBootstrapOpen(true);
        setStatus({ text: '', isError: false });
      }
    } catch {
      setStatus({ text: 'Bootstrap failed: Connection error', isError: true });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div id="loginWrap" className="login-wrap">
      <section className="card login-card">
        <h1>Login</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <div className="password-input-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isBusy}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="actions">
            <button type="submit" className="primary" disabled={isBusy}>
              Login
            </button>
            <button type="button" className="secondary" disabled={isBusy} onClick={handleSync}>
              Sync
            </button>
            {isAuthEmpty && (
              <button
                type="button"
                className="secondary"
                disabled={isBusy}
                onClick={handleBootstrap}
              >
                Bootstrap
              </button>
            )}
          </div>
        </form>
        <div className={status.isError ? 'status error' : 'status'}>{status.text}</div>
      </section>

      <BootstrapModal
        isOpen={isBootstrapOpen}
        onClose={() => setIsBootstrapOpen(false)}
        onSuccess={(message) => {
          setStatus({ text: message, isError: false });
          setIsAuthEmpty(false);
        }}
      />
    </div>
  );
}
