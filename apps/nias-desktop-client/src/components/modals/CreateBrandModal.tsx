import { useState } from 'react';
import type { attribute } from '@nias/shared';
import type { StatusState } from '../../types';
import ModalTemplate from './ModalTemplate';

interface CreateBrandModalProps {
  handleClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function toNormalizedName(name: string): string {
  return name.trim().toLowerCase();
}

export default function CreateBrandModal({
  handleClose,
  onSuccess,
  onError,
}: CreateBrandModalProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({ text: '', isError: false });
  const [skuCode, setSkuCode] = useState('');
  const [name, setName] = useState('');

  const handleCreate = async () => {
    const trimmedSkuCode = skuCode.trim();
    const trimmedName = name.trim();

    if (!trimmedSkuCode) {
      setStatus({ text: 'SKU is required', isError: true });
      return;
    }

    if (!trimmedName) {
      setStatus({ text: 'Name is required', isError: true });
      return;
    }

    setIsBusy(true);
    setStatus({ text: 'Creating brand...', isError: false });

    try {
      const payload: attribute.CreateBrandInput = {
        skuCode: trimmedSkuCode,
        name: trimmedName,
        normalizedName: toNormalizedName(trimmedName),
        deletedAt: null,
        isSynced: false,
        syncVersion: 0,
      };

      const result = await window.electronAPI.brandCreate(payload);
      if (!result.success) {
        const message = result.message || 'Failed to create brand';
        setStatus({ text: message, isError: true });
        onError(message);
        return;
      }

      const message = result.message || 'Brand created successfully';
      onSuccess(message);
      handleClose();
    } catch {
      const message = 'Create brand failed: Connection error';
      setStatus({ text: message, isError: true });
      onError(message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ModalTemplate title="Create Brand" handleClose={handleClose}>
      <div className="modal-fields">
        <label htmlFor="brandSkuCode">SKU</label>
        <input
          id="brandSkuCode"
          type="text"
          placeholder="Brand SKU"
          value={skuCode}
          onChange={(event) => setSkuCode(event.target.value)}
          disabled={isBusy}
        />

        <label htmlFor="brandName">Name</label>
        <input
          id="brandName"
          type="text"
          placeholder="Brand Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isBusy}
        />
      </div>

      <div className="actions">
        <button className="secondary" type="button" onClick={handleClose} disabled={isBusy}>
          Cancel
        </button>
        <button className="primary" type="button" onClick={handleCreate} disabled={isBusy}>
          Create Brand
        </button>
      </div>

      <div className={status.isError ? 'status error' : 'status'}>{status.text}</div>
    </ModalTemplate>
  );
}
