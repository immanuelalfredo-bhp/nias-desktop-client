import { useEffect, useState } from 'react';
import type { system } from '@nias/shared';
import type { StatusState } from '../../../types';
import ModalTemplate from '../../../components/templates/Modal';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  userToEdit?: system.User | null;
  isSelfEdit?: boolean;
}

export default function UserModal({
  isOpen,
  onClose,
  onSuccess,
  userToEdit,
  isSelfEdit = false,
}: UserModalProps) {
  const isEditMode = !!userToEdit;

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    text: '',
    isError: false,
  });

  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setDisplayName(userToEdit.displayName || '');
        setEmail(userToEdit.email || '');
        setPassword('');
        setConfirmPassword('');
      } else {
        setDisplayName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
      setStatus({ text: '', isError: false });
    }
  }, [isOpen, userToEdit]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsBusy(true);
    setStatus({
      text: isEditMode
        ? isSelfEdit
          ? 'Saving profile...'
          : 'Updating user...'
        : 'Creating user...',
      isError: false,
    });

    try {
      if (!displayName.trim()) {
        setStatus({ text: 'Display name is required', isError: true });
        return;
      }

      if (!email.trim()) {
        setStatus({ text: 'Email is required', isError: true });
        return;
      }

      if (!isEditMode && (!password || !confirmPassword)) {
        setStatus({ text: 'Password and confirm password are required', isError: true });
        return;
      }

      if ((password || confirmPassword) && password !== confirmPassword) {
        setStatus({ text: 'Passwords do not match', isError: true });
        return;
      }

      if (isEditMode && userToEdit) {
        const payload: system.UpdateUserInput = {
          id: userToEdit.id,
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
          ...(password ? { password } : {}),
        };

        const result = await window.electronAPI.userUpdate(payload);

        if (result.success) {
          onClose();
          onSuccess(isSelfEdit ? 'Profile updated successfully' : 'Update user success');
        } else {
          setStatus({ text: `Error: ${result.message}`, isError: true });
        }
      } else {
        const payload: system.CreateUserInput = {
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
          isManagedBy: null,
          password,
        };

        const result = await window.electronAPI.userCreate(payload);

        if (result.success) {
          onClose();
          onSuccess('Create user success');
        } else {
          setStatus({ text: `Error: ${result.message}`, isError: true });
        }
      }
    } catch (err) {
      setStatus({ text: 'Error: Connection error', isError: true });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ModalTemplate title={isEditMode ? 'Edit User' : 'Create User'} handleClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleConfirm();
        }}
      >
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

        <label htmlFor="password">{isEditMode ? 'New Password' : 'Password'}</label>
        <input
          id="password"
          type="password"
          placeholder={isEditMode ? 'Leave blank to keep current password' : 'Password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isBusy}
          required={!isEditMode}
        />

        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          placeholder={isEditMode ? 'Re-enter new password if changing it' : 'Confirm Password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isBusy}
          required={!isEditMode}
        />

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
