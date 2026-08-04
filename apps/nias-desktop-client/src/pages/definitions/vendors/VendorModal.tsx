import { useEffect, useState } from 'react';
import type { attribute } from '@nias/shared';
import type { StatusState } from '../../../types';
import ModalTemplate from '../../../components/templates/Modal';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  vendorToEdit?: attribute.Vendor | null;
}

export default function VendorModal({ isOpen, onClose, onSuccess, vendorToEdit }: VendorModalProps) {
  const isEditMode = !!vendorToEdit;

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
      if (vendorToEdit) {
        setSkuCode(vendorToEdit.skuCode || '');
        setName(vendorToEdit.name || '');
        setSortOrder(vendorToEdit.sortOrder ?? '');
      } else {
        setSkuCode('');
        setName('');
        setSortOrder('');
      }
      setStatus({ text: '', isError: false });
    }
  }, [isOpen, vendorToEdit]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsBusy(true);
    setStatus({ text: isEditMode ? 'Updating vendor...' : 'Creating vendor...', isError: false });

    try {
      if (!name.trim()) {
        setStatus({ text: 'Name is required', isError: true });
        return;
      }

      if (isEditMode && vendorToEdit) {
        const payload: attribute.UpdateVendorInput = {
          id: vendorToEdit.id,
          name: name.trim(),
          skuCode: skuCode.trim(),
          sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        };

        const result = await window.electronAPI.vendorUpdate(payload);

        if (result.success) {
          onClose();
          onSuccess('Update vendor success');
        } else {
          setStatus({ text: `Error: ${result.message}`, isError: true });
        }
      } else {
        const payload: attribute.CreateVendorInput = {
          name: name.trim(),
          skuCode: skuCode.trim(),
          sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        };

        const result = await window.electronAPI.vendorCreate(payload);

        if (result.success) {
          onClose();
          onSuccess('Create vendor success');
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
    <ModalTemplate title={isEditMode ? 'Edit Vendor' : 'Create Vendor'} handleClose={onClose}>
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