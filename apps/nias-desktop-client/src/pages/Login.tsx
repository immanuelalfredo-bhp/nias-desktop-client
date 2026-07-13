import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BootstrapModal from '../components/modals/BootstrapModal';
import type { LoginRouteState, StatusState } from '../types';

export default function Login() {
  const [email, setEmail] = useState('');
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
        window.localStorage.setItem('nias.currentEmail', email);
        navigate('/dashboard', { replace: true });
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

  const handleBootstrap = () => {
    navigate('/bootstrap', { replace: true });
  };

  return (
    <div id="loginWrap" className="login-wrap">
      <section className="card login-card">
        <h1>Login</h1>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
            <button onClick={() => setShowModal(true)} className="secondary" disabled={isBusy}>
              Bootstrap
            </button>
          )}
        </div>
        <div className={status.isError ? 'status error' : 'status'}>{status.text}</div>
      </section>
      {showModal && (
        <BootstrapModal
          handleClose={() => setShowModal(false)}
          handleBootstrap={() => {
            handleBootstrap();
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
