import { useState } from 'react';
import type { attribute } from '@nias/shared';
import type { StatusState } from '../../types';
import ModalTemplate from './ModalTemplate';

interface CreateModeModalProps {
  handleClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function toNormalizedName(name: string): string {
  return name.trim().toLowerCase();
}

function parseSortOrder(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function CreateModeModal({
  handleClose,
  onSuccess,
  onError,
}: CreateModeModalProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({ text: '', isError: false });
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const handleCreate = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setStatus({ text: 'Name is required', isError: true });
      return;
    }

    setIsBusy(true);
    setStatus({ text: 'Creating mode...', isError: false });

    try {
      const payload: attribute.CreateModeInput = {
        name: trimmedName,
        normalizedName: toNormalizedName(trimmedName),
        sortOrder: parseSortOrder(sortOrder),
        deletedAt: null,
        isSynced: false,
        syncVersion: 0,
      };

      const result = await window.electronAPI.modeCreate(payload);
      if (!result.success) {
        const message = result.message || 'Failed to create mode';
        setStatus({ text: message, isError: true });
        onError(message);
        return;
      }

      const message = result.message || 'Mode created successfully';
      onSuccess(message);
      handleClose();
    } catch {
      const message = 'Create mode failed: Connection error';
      setStatus({ text: message, isError: true });
      onError(message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ModalTemplate title="Create Mode" handleClose={handleClose}>
      <div className="modal-fields">
        <label htmlFor="modeName">Name</label>
        <input
          id="modeName"
          type="text"
          placeholder="Mode Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isBusy}
        />

        <label htmlFor="modeSortOrder">Sort Order</label>
        <input
          id="modeSortOrder"
          type="number"
          step="0.01"
          placeholder="0"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          disabled={isBusy}
        />
      </div>

      <div className="actions">
        <button className="secondary" type="button" onClick={handleClose} disabled={isBusy}>
          Cancel
        </button>
        <button className="primary" type="button" onClick={handleCreate} disabled={isBusy}>
          Create Mode
        </button>
      </div>

      <div className={status.isError ? 'status error' : 'status'}>{status.text}</div>
    </ModalTemplate>
  );
}
