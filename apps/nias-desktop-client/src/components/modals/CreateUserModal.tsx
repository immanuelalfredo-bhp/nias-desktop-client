import { useState } from 'react';
import ModalTemplate from './ModalTemplate';
import type { StatusState } from '../../types';
import type { system } from '@nias/shared';

interface CreateUserModalProps {
  handleClose: () => void;
}

export default function CreateUserModal({ handleClose }: CreateUserModalProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    text: '',
    isError: false,
  });
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isManagedBy, setIsManagedBy] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleCreateUser = async () => {
    setIsBusy(true);
    setStatus({ text: 'Creating user...', isError: false });

    try {
      if (!email) {
        setStatus({ text: 'Email is required', isError: true });
        return;
      }
      if (!displayName) {
        setStatus({ text: 'Display Name is required', isError: true });
        return;
      }
      if (!password || !confirmPassword) {
        setStatus({ text: 'Password is required', isError: true });
        return;
      }
      if (password !== confirmPassword) {
        setStatus({ text: 'Passwords do not match', isError: true });
        return;
      }
      const payload: system.CreateUserInput = {
        email,
        displayName,
        isManagedBy,
        password,
      };

      const result = await window.electronAPI.userCreate(payload);
    } catch (err) {
      setStatus({ text: 'Create user failed: Connection error', isError: true });
    } finally {
      setIsBusy(false);
    }
  };
  
	return (
		<ModalTemplate title="Create User" handleClose={handleClose}>
			<input
				id="email"
				type="email"
				placeholder="Email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				disabled={isBusy}
			/>
			<input
				id="displayName"
				type="text"
				placeholder="Display Name"
				value={displayName}
				onChange={(e) => setDisplayName(e.target.value)}
				disabled={isBusy}
			/>
			<input
				id="isManagedBy"
				type="text"
				placeholder="Managed By (optional)"
				value={isManagedBy ?? ''}
				onChange={(e) => setIsManagedBy(e.target.value || null)}
				disabled={isBusy}
			/>
			<input
				id="password"
				type="password"
				placeholder="Password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				disabled={isBusy}
			/>
			<input
				id="confirmPassword"
				type="password"
				placeholder="Confirm Password"
				value={confirmPassword}
				onChange={(e) => setConfirmPassword(e.target.value)}
				disabled={isBusy}
			/>
			<div className="actions">
				<button className="secondary" onClick={handleClose} disabled={isBusy}>
					Cancel
				</button>
				<button className="primary" onClick={handleCreateUser} disabled={isBusy}>
					Create User
				</button>
			</div>
			<div className={status.isError ? 'status error' : 'status'}>
				{status.text}
			</div>
		</ModalTemplate>
	);
}