import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BootstrapModal from '../components/modals/BootstrapModal';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = () => { /* ... */ };
  const handleBootstrap = async (bootstrapSecret: string) => {
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
          {isAuthEmpty && (
            <button onClick={() => setShowModal(true)} className="secondary">
              Bootstrap
            </button>
          )}
        </div>
      <div id="status" className="status"></div>
      </section>
      {showModal && (
        <BootstrapModal
          onClose={() => setShowModal(false)}
          onExecute={async (bootstrapSecret) => {
            handleBootstrap(bootstrapSecret);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}