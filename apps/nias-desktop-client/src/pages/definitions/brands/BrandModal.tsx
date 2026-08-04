import { useEffect, useState } from 'react';
import type { attribute } from '@nias/shared';
import type { StatusState } from '../../../types';
import ModalTemplate from '../../../components/templates/Modal';

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  brandToEdit?: attribute.Brand | null;
}

export default function BrandModal({ isOpen, onClose, onSuccess, brandToEdit }: BrandModalProps) {
  const isEditMode = !!brandToEdit;

  const [skuCode, setSkuCode] = useState('');
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState<number | ''>('');

  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    text: '',
    isError: false,
  });

  useEffect(() => {
    if (isOpen) {
      if (brandToEdit) {
        setSkuCode(brandToEdit.skuCode || '');
        setName(brandToEdit.name || '');
        setSortOrder(brandToEdit.sortOrder ?? '');
      } else {
        setSkuCode('');
        setName('');
        setSortOrder('');
      }
      setStatus({ text: '', isError: false });
    }
  }, [isOpen, brandToEdit]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsBusy(true);
    setStatus({ text: isEditMode ? 'Updating brand...' : 'Creating brand...', isError: false });

    try {
      if (!name.trim()) {
        setStatus({ text: 'Name is required', isError: true });
        return;
      }

      if (isEditMode && brandToEdit) {
        const payload: attribute.UpdateBrandInput = {
          id: brandToEdit.id,
          name: name.trim(),
          skuCode: skuCode.trim(),
          sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        };

        const result = await window.electronAPI.brandUpdate(payload);

        if (result.success) {
          onClose();
          onSuccess('Update brand success');
        } else {
          setStatus({ text: `Error: ${result.message}`, isError: true });
        }
      } else {
        const payload: attribute.CreateBrandInput = {
          name: name.trim(),
          skuCode: skuCode.trim(),
          sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        };

        const result = await window.electronAPI.brandCreate(payload);

        if (result.success) {
          onClose();
          onSuccess('Create brand success');
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
    <ModalTemplate title={isEditMode ? 'Edit Brand' : 'Create Brand'} handleClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleConfirm();
        }}
      >
        <label htmlFor="skuCode">SKU Code</label>
        <input
          id="skuCode"
          type="text"
          placeholder="SKU Code"
          value={skuCode}
          onChange={(e) => setSkuCode(e.target.value)}
          disabled={isBusy}
        />

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