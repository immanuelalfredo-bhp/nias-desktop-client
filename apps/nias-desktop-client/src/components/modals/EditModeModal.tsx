import { useState } from 'react';
import type { attribute } from '@nias/shared';
import type { StatusState } from '../../types';
import ModalTemplate from './ModalTemplate';

interface EditModeModalProps {
  mode: attribute.Mode;
  handleClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function toNormalizedName(name: string): string {
  return name.trim().toLowerCase();
}

function parseSortOrder(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export default function EditModeModal({
  mode,
  handleClose,
  onSuccess,
  onError,
}: EditModeModalProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({ text: '', isError: false });
  const [name, setName] = useState(mode.name);
  const [sortOrder, setSortOrder] = useState(String(mode.sortOrder));

  const handleUpdate = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setStatus({ text: 'Name is required', isError: true });
      return;
    }

    setIsBusy(true);
    setStatus({ text: 'Updating mode...', isError: false });

    try {
      const payload: attribute.UpdateMode = {
        id: mode.id,
        name: trimmedName,
        normalizedName: toNormalizedName(trimmedName),
        sortOrder: parseSortOrder(sortOrder, mode.sortOrder),
        updatedAt: new Date().toISOString(),
      };

      const result = await window.electronAPI.modeUpdate(payload);
      if (!result.success) {
        const message = result.message || 'Failed to update mode';
        setStatus({ text: message, isError: true });
        onError(message);
        return;
      }

      const message = result.message || 'Mode updated successfully';
      onSuccess(message);
      handleClose();
    } catch {
      const message = 'Update mode failed: Connection error';
      setStatus({ text: message, isError: true });
      onError(message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ModalTemplate title="Edit Mode" handleClose={handleClose}>
      <div className="modal-fields">
        <label htmlFor="editModeName">Name</label>
        <input
          id="editModeName"
          type="text"
          placeholder="Mode Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isBusy}
        />

        <label htmlFor="editModeSortOrder">Sort Order</label>
        <input
          id="editModeSortOrder"
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
        <button className="primary" type="button" onClick={handleUpdate} disabled={isBusy}>
          Save Changes
        </button>
      </div>

      <div className={status.isError ? 'status error' : 'status'}>{status.text}</div>
    </ModalTemplate>
  );
}
