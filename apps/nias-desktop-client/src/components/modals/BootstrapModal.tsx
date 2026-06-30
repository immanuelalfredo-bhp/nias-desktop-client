import { useState } from 'react';
import ModalTemplate from './ModalTemplate';

interface BootstrapModalProps {
  onClose: () => void;
  onExecute: (bootstrapSecret: string) => Promise<void>;
}

export default function BootstrapModal({ onClose, onExecute }: BootstrapModalProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState({ text: '', isError: false });
  const [bootstrapSecret, setBootstrapSecret] = useState('');

 const handleConfirm = async () => {
  setIsBusy(true);
  setStatus({ text: 'Verifying...', isError: false });

    try {
      const result = await window.electronAPI.bootstrapStatus(bootstrapSecret);

      // 1. Handle invalid token (Mapped from your IPC 401 status)
      if (result.isValid === false) {
        setStatus({ text: 'Incorrect token', isError: true });
      } 
      // 2. Handle empty system (The success state)
      else if (result.isEmpty === true) {
        await onExecute(bootstrapSecret); 
        onClose();
      } 
      // 3. Handle initialized systems
      else {
        setStatus({ text: 'System already initialized', isError: true });
      }
    } catch (err) {
      // 4. Catches network/server errors thrown from the IPC handler
      setStatus({ text: 'Bootstrap failed: Connection error', isError: true });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ModalTemplate title="Bootstrap Token" onClose={onClose}>
      <input 
        id="input"
        type="password"
        value={bootstrapSecret} 
        onChange={(e) => setBootstrapSecret(e.target.value)} 
        disabled={isBusy}
      />

      <div className="actions">
        <button className="secondary" onClick={onClose} disabled={isBusy}>Cancel</button>
        <button className="primary" onClick={handleConfirm} disabled={isBusy}>
          {isBusy ? 'Processing...' : 'Bootstrap'}
        </button>
      </div>
      
      <div className={status.isError ? 'status error' : 'status'}>
        {status.text}
      </div>
    </ModalTemplate>
  );
}