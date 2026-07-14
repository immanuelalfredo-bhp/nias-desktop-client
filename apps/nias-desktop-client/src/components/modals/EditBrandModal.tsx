import { useState } from 'react';
import type { attribute } from '@nias/shared';
import type { StatusState } from '../../types';
import ModalTemplate from './ModalTemplate';

interface EditBrandModalProps {
  brand: attribute.Brand;
  handleClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function toNormalizedName(name: string): string {
  return name.trim().toLowerCase();
}

export default function EditBrandModal({
  brand,
  handleClose,
  onSuccess,
  onError,
}: EditBrandModalProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({ text: '', isError: false });
  const [skuCode, setSkuCode] = useState(brand.skuCode);
  const [name, setName] = useState(brand.name);

  const handleUpdate = async () => {
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
    setStatus({ text: 'Updating brand...', isError: false });

    try {
      const payload: attribute.UpdateBrand = {
        id: brand.id,
        skuCode: trimmedSkuCode,
        name: trimmedName,
        normalizedName: toNormalizedName(trimmedName),
        updatedAt: new Date().toISOString(),
      };

      const result = await window.electronAPI.brandUpdate(payload);
      if (!result.success) {
        const message = result.message || 'Failed to update brand';
        setStatus({ text: message, isError: true });
        onError(message);
        return;
      }

      const message = result.message || 'Brand updated successfully';
      onSuccess(message);
      handleClose();
    } catch {
      const message = 'Update brand failed: Connection error';
      setStatus({ text: message, isError: true });
      onError(message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ModalTemplate title="Edit Brand" handleClose={handleClose}>
      <div className="modal-fields">
        <label htmlFor="editBrandSkuCode">SKU</label>
        <input
          id="editBrandSkuCode"
          type="text"
          placeholder="Brand SKU"
          value={skuCode}
          onChange={(event) => setSkuCode(event.target.value)}
          disabled={isBusy}
        />

        <label htmlFor="editBrandName">Name</label>
        <input
          id="editBrandName"
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
        <button className="primary" type="button" onClick={handleUpdate} disabled={isBusy}>
          Save Changes
        </button>
      </div>

      <div className={status.isError ? 'status error' : 'status'}>{status.text}</div>
    </ModalTemplate>
  );
}
