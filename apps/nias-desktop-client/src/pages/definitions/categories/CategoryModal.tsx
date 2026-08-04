import { useEffect, useState } from 'react';
import type { attribute } from '@nias/shared';
import type { StatusState } from '../../../types';
import ModalTemplate from '../../../components/templates/Modal';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  categoryToEdit?: attribute.Category | null;
}

export default function CategoryModal({ isOpen, onClose, onSuccess, categoryToEdit }: CategoryModalProps) {
  const isEditMode = !!categoryToEdit;

  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState<number | ''>('');

  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    text: '',
    isError: false,
  });

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setName(categoryToEdit.name || '');
        setSortOrder(categoryToEdit.sortOrder ?? '');
      } else {
        setName('');
        setSortOrder('');
      }
      setStatus({ text: '', isError: false });
    }
  }, [isOpen, categoryToEdit]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsBusy(true);
    setStatus({ text: isEditMode ? 'Updating category...' : 'Creating category...', isError: false });

    try {
      if (!name.trim()) {
        setStatus({ text: 'Name is required', isError: true });
        return;
      }

      if (isEditMode && categoryToEdit) {
        const payload: attribute.UpdateCategoryInput = {
          id: categoryToEdit.id,
          name: name.trim(),
          sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        };

        const result = await window.electronAPI.categoryUpdate(payload);

        if (result.success) {
          onClose();
          onSuccess('Update category success');
        } else {
          setStatus({ text: `Error: ${result.message}`, isError: true });
        }
      } else {
        const payload: attribute.CreateCategoryInput = {
          name: name.trim(),
          sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        };

        const result = await window.electronAPI.categoryCreate(payload);

        if (result.success) {
          onClose();
          onSuccess('Create category success');
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
    <ModalTemplate title={isEditMode ? 'Edit Category' : 'Create Category'} handleClose={onClose}>
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