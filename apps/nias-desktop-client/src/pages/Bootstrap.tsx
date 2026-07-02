import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BootstrapAccount } from '@nias/shared';
import type { StatusState } from '../types/ui';

export default function BootstrapPage() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    text: '',
    isError: false,
  });
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const navigate = useNavigate();

  const handleConfirm = async () => {
    setIsBusy(true);
    setStatus({ text: 'Verifying...', isError: false });

    try {
      if (!bootstrapSecret) {
        setStatus({ text: 'Bootstrap token is required', isError: true });
        return;
      } else if (!username) {
        setStatus({ text: 'Username is required', isError: true });
        return;
      } else if (!password || !confirmPassword) {
        setStatus({ text: 'Password is required', isError: true });
        return;
      } else if (password !== confirmPassword) {
        setStatus({ text: 'Passwords do not match', isError: true });
        return;
      } else {
        const payload: BootstrapAccount = {
          username,
          displayName,
          email,
          password,
        };

        const result = await window.electronAPI.bootstrapExecute(
          bootstrapSecret,
          payload
        );

        if (result.success) {
          navigate('/login', {
            state: { message: 'Bootstrap successful. Please log in.' },
          });
        } else {
          setStatus({ text: `Bootstrap failed: ${result.message}`, isError: true });
        }
      }
    } catch (err) {
      setStatus({ text: 'Bootstrap failed: Connection error', isError: true });
    } finally {
      setIsBusy(false);
    }
  };
  const handleCancel = () => {
    navigate('/login');
  };
  
  return (
    <div id="loginWrap" className="login-wrap">
      <section className="card login-card">
        <h1>Bootstrap User</h1>
        <label htmlFor="bootstrapSecret">Bootstrap Secret</label>
          <input
            id="bootstrapSecret"
            type="password"
            placeholder="Bootstrap Secret"
            value={bootstrapSecret}
            onChange={(e) => setBootstrapSecret(e.target.value)}
          />

        <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

        <label htmlFor="displayName">Display Name</label>
          <input
            id="displayName"
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

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
          
        <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

        <div className="actions">
          <button className="primary" onClick={handleConfirm} disabled={isBusy}>
            Confirm
          </button>
          <button className="secondary" onClick={handleCancel} disabled={isBusy}>
            Cancel
          </button>
        </div>

        <div className={status.isError ? 'status error' : 'status'}>
          {status.text}
        </div>
      </section>
    </div>
  );
}