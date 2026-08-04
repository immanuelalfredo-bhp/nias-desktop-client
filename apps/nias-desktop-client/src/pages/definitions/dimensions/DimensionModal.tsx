import { useEffect, useState } from 'react';
import type { attribute } from '@nias/shared';
import type { StatusState } from '../../../types';
import ModalTemplate from '../../../components/templates/Modal';

interface DimensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  dimensionToEdit?: attribute.Dimension | null;
}

export default function DimensionModal({
  isOpen,
  onClose,
  onSuccess,
  dimensionToEdit,
}: DimensionModalProps) {
  const isEditMode = !!dimensionToEdit;

  const [name, setName] = useState('');
  const [formName, setFormName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [scope, setScope] = useState<'global' | 'contextual'>('global');
  const [position, setPosition] = useState<'prefix' | 'suffix' | 'dimensions' | 'end'>(
    'dimensions',
  );
  const [sortOrder, setSortOrder] = useState<number | ''>('');

  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    text: '',
    isError: false,
  });

  useEffect(() => {
    if (isOpen) {
      if (dimensionToEdit) {
        setName(dimensionToEdit.name || '');
        setFormName(dimensionToEdit.formName || '');
        setDisplayName(dimensionToEdit.displayName || '');
        setScope((dimensionToEdit.scope as 'global' | 'contextual') || 'global');
        setPosition(
          (dimensionToEdit.position as 'prefix' | 'suffix' | 'dimensions' | 'end') || 'dimensions',
        );
        setSortOrder(dimensionToEdit.sortOrder ?? '');
      } else {
        setName('');
        setFormName('');
        setDisplayName('');
        setScope('global');
        setPosition('dimensions');
        setSortOrder('');
      }
      setStatus({ text: '', isError: false });
    }
  }, [isOpen, dimensionToEdit]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsBusy(true);
    setStatus({
      text: isEditMode ? 'Updating dimension...' : 'Creating dimension...',
      isError: false,
    });

    try {
      if (!name.trim()) {
        setStatus({ text: 'Name is required', isError: true });
        return;
      }

      if (isEditMode && dimensionToEdit) {
        const payload = {
          id: dimensionToEdit.id,
          name: name.trim(),
          formName: formName.trim(),
          displayName: displayName.trim(),
          scope,
          position,
          sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        };

        const result = await window.electronAPI.dimensionUpdate(payload);

        if (result.success) {
          onClose();
          onSuccess('Update dimension success');
        } else {
          setStatus({ text: `Error: ${result.message}`, isError: true });
        }
      } else {
        const payload = {
          name: name.trim(),
          formName: formName.trim(),
          displayName: displayName.trim(),
          scope,
          position,
          sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        };

        const result = await window.electronAPI.dimensionCreate(payload);

        if (result.success) {
          onClose();
          onSuccess('Create dimension success');
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
    <ModalTemplate title={isEditMode ? 'Edit Dimension' : 'Create Dimension'} handleClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleConfirm();
        }}
      >
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isBusy}
          required
        />

        <label htmlFor="formName">Form Name</label>
        <input
          id="formName"
          type="text"
          placeholder="Form Name"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          disabled={isBusy}
          required
        />

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

        <label htmlFor="scope">Scope</label>
        <select
          id="scope"
          value={scope}
          onChange={(e) => setScope(e.target.value as 'global' | 'contextual')}
          disabled={isBusy}
        >
          <option value="global">Global</option>
          <option value="contextual">Contextual</option>
        </select>

        <label htmlFor="position">Position</label>
        <select
          id="position"
          value={position}
          onChange={(e) =>
            setPosition(e.target.value as 'prefix' | 'suffix' | 'dimensions' | 'end')
          }
          disabled={isBusy}
        >
          <option value="dimensions">Dimensions</option>
          <option value="prefix">Prefix</option>
          <option value="suffix">Suffix</option>
          <option value="end">End</option>
        </select>

        <label htmlFor="sortOrder">Sort Order</label>
        <input
          id="sortOrder"
          type="number"
          placeholder="Sort Order"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={isBusy}
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
