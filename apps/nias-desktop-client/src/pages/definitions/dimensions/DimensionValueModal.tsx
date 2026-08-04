import { useEffect, useState } from 'react';
import type { attribute } from '@nias/shared';
import type { StatusState } from '../../../types';
import ModalTemplate from '../../../components/templates/Modal';

interface DimensionValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  dimension: attribute.Dimension | null;
  valueToEdit?: attribute.DimensionValue | null;
}

export default function DimensionValueModal({
  isOpen,
  onClose,
  onSuccess,
  dimension,
  valueToEdit,
}: DimensionValueModalProps) {
  const isEditMode = !!valueToEdit;

  const [skuCode, setSkuCode] = useState('');
  const [name, setName] = useState('');
  const [numericValue, setNumericValue] = useState<number | ''>('');
  const [sortOrder, setSortOrder] = useState<number | ''>('');

  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    text: '',
    isError: false,
  });

  useEffect(() => {
    if (isOpen) {
      if (valueToEdit) {
        setSkuCode(valueToEdit.skuCode || '');
        setName(valueToEdit.name || '');
        setNumericValue(valueToEdit.numericValue ?? '');
        setSortOrder(valueToEdit.sortOrder ?? '');
      } else {
        setSkuCode('');
        setName('');
        setNumericValue('');
        setSortOrder('');
      }
      setStatus({ text: '', isError: false });
    }
  }, [isOpen, valueToEdit]);

  if (!isOpen || !dimension) return null;

  const handleConfirm = async () => {
    setIsBusy(true);
    setStatus({
      text: isEditMode ? 'Updating dimension value...' : 'Creating dimension value...',
      isError: false,
    });

    try {
      if (!name.trim()) {
        setStatus({ text: 'Name is required', isError: true });
        return;
      }

      if (!skuCode.trim()) {
        setStatus({ text: 'SKU Code is required', isError: true });
        return;
      }

      if (isEditMode && valueToEdit) {
        const payload = {
          id: valueToEdit.id,
          dimensionId: dimension.id,
          name: name.trim(),
          skuCode: skuCode.trim(),
          numericValue: numericValue === '' ? null : numericValue,
          sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        };

        const result = await window.electronAPI.dimensionValueUpdate(payload);

        if (result.success) {
          onClose();
          onSuccess('Update dimension value success');
        } else {
          setStatus({ text: `Error: ${result.message}`, isError: true });
        }
      } else {
        const payload = {
          dimensionId: dimension.id,
          name: name.trim(),
          skuCode: skuCode.trim(),
          numericValue: numericValue === '' ? null : numericValue,
          sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        };

        const result = await window.electronAPI.dimensionValueCreate(payload);

        if (result.success) {
          onClose();
          onSuccess('Create dimension value success');
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
    <ModalTemplate
      title={isEditMode ? `Edit Value for ${dimension.name}` : `Add Value to ${dimension.name}`}
      handleClose={onClose}
    >
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
          required
        />

        <label htmlFor="name">Value Name</label>
        <input
          id="name"
          type="text"
          placeholder="Value Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isBusy}
          required
        />

        <label htmlFor="numericValue">Numeric Value (Optional)</label>
        <input
          id="numericValue"
          type="number"
          step="any"
          placeholder="Numeric Value"
          value={numericValue}
          onChange={(e) => setNumericValue(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={isBusy}
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
