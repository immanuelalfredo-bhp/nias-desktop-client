import { useState } from 'react';
import ModalTemplate from './ModalTemplate';
import type { StatusState } from '../../types';

interface BootstrapModalProps {
  handleClose: () => void;
  handleBootstrap: () => void;
}

export default function BootstrapModal({ handleClose, handleBootstrap }: BootstrapModalProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    text: '',
    isError: false,
  });
  const [bootstrapSecret, setBootstrapSecret] = useState('');

  const handleConfirm = async () => {
    setIsBusy(true);
    setStatus({ text: 'Verifying...', isError: false });

    try {
      const result = await window.electronAPI.bootstrapStatus(bootstrapSecret);

      if (!result.success) {
        setStatus({ text: 'Incorrect token', isError: true });
      } else if (result.data.isEmpty) {
        handleBootstrap();
      } else {
        setStatus({ text: 'System already initialized', isError: true });
      }
    } catch {
      setStatus({ text: 'Bootstrap failed: Connection error', isError: true });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ModalTemplate title="Bootstrap Secret" handleClose={handleClose}>
      <input 
        id="input"
        type="password"
        value={bootstrapSecret} 
        onChange={(e) => setBootstrapSecret(e.target.value)} 
        disabled={isBusy}
      />

      <div className="actions">
        <button className="secondary" onClick={handleClose} disabled={isBusy}>
          Cancel
        </button>
        <button className="primary" onClick={handleConfirm} disabled={isBusy}>
          Confirm
        </button>
      </div>
      
      <div className={status.isError ? 'status error' : 'status'}>
        {status.text}
      </div>
    </ModalTemplate>
  );
}