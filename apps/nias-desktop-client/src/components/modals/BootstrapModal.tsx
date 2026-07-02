import { useState } from 'react';
import ModalTemplate from './ModalTemplate';

interface BootstrapModalProps {
  onClose: () => void;
  onExecute: () => void;
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

      if (result.isValid === false) {
        setStatus({ text: 'Incorrect token', isError: true });
      } 
      else if (result.isEmpty === true) {
        onExecute(); 
        onClose();
      } 
      else {
        setStatus({ text: 'System already initialized', isError: true });
      }
    } catch (err) {
      setStatus({ text: 'Bootstrap failed: Connection error', isError: true });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ModalTemplate title="Bootstrap Secret" onClose={onClose}>
      <input 
        id="input"
        type="password"
        value={bootstrapSecret} 
        onChange={(e) => setBootstrapSecret(e.target.value)} 
        disabled={isBusy}
      />

      <div className="actions">
        <button className="secondary" onClick={onClose} disabled={isBusy}>Cancel</button>
        <button className="primary" onClick={handleConfirm} disabled={isBusy}>Confirm</button>
      </div>
      
      <div className={status.isError ? 'status error' : 'status'}>
        {status.text}
      </div>
    </ModalTemplate>
  );
}