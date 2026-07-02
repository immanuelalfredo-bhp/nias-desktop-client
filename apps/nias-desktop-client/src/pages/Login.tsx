import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BootstrapModal from '../components/modals/BootstrapModal';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState({ text: '', isError: false });
  const [isAuthEmpty, setIsAuthEmpty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        console.log('Checking auth database status...');
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
        navigate('/dashboard');
        return;
      }

      setStatus({ text: 'Syncing account data...', isError: false });
      const userResult = await window.electronAPI.authFetchUser(username, password);
      const syncResult = await window.electronAPI.authSyncUsers();
      console.log('User fetch result:', userResult);
      console.log('Sync result:', syncResult);

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
          <button onClick={handleLogin} className="primary">Login</button>
          <button onClick={handleSync} className="secondary">Sync</button>
          {isAuthEmpty && (
            <button onClick={() => setShowModal(true)} className="secondary">
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