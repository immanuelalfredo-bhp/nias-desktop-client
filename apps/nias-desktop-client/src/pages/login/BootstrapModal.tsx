import { useState } from 'react';
import type { local } from '@nias/shared';
import type { StatusState } from '../../types';
import ModalTemplate from '../../components/templates/Modal';

interface BootstrapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function BootstrapModal({ isOpen, onClose, onSuccess }: BootstrapModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    text: '',
    isError: false,
  });
  const [bootstrapSecret, setBootstrapSecret] = useState('');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsBusy(true);
    setStatus({ text: 'Verifying...', isError: false });

    try {
      if (!bootstrapSecret) {
        setStatus({ text: 'Bootstrap token is required', isError: true });
        return;
      } else if (!displayName) {
        setStatus({ text: 'Display Name is required', isError: true });
        return;
      } else if (!password || !confirmPassword) {
        setStatus({ text: 'Password is required', isError: true });
        return;
      } else if (password !== confirmPassword) {
        setStatus({ text: 'Passwords do not match', isError: true });
        return;
      } else {
        const payload: local.BootstrapInput = {
          displayName,
          email,
          password,
          bootstrapKey: bootstrapSecret,
        };

        const result = await window.electronAPI.bootstrapExecute(payload);

        if (result.success) {
          onClose();
          onSuccess('Bootstrap successful. Please log in.');
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

  return (
    <ModalTemplate title="Bootstrap" handleClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleConfirm();
        }}
      >
        <label htmlFor="bootstrapSecret">Bootstrap Secret</label>
        <div className="password-input-wrapper">
          <input
            id="bootstrapSecret"
            type={showSecret ? 'text' : 'password'}
            placeholder="Bootstrap Secret"
            value={bootstrapSecret}
            onChange={(e) => setBootstrapSecret(e.target.value)}
            disabled={isBusy}
            required
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowSecret((prev) => !prev)}
            tabIndex={-1}
          >
            {showSecret ? 'Hide' : 'Show'}
          </button>
        </div>

        <label htmlFor="displayName">Display Name</label>
        <input
          id="displayName"
          type="text"
          placeholder="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={isBusy}
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isBusy}
          required
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

        <label htmlFor="confirmPassword">Confirm Password</label>
        <div className="password-input-wrapper">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isBusy}
            required
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            tabIndex={-1}
          >
            {showConfirmPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <div className="actions">
          <button type="submit" className="primary" disabled={isBusy}>
            Confirm
          </button>
          <button type="button" className="secondary" onClick={onClose} disabled={isBusy}>
            Cancel
          </button>
        </div>

        <div className={status.isError ? 'status error' : 'status'}>{status.text}</div>
      </form>
    </ModalTemplate>
  );
}
