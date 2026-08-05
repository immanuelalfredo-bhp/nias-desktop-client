import { useState, useEffect } from 'react';

interface OrderPanelProps {
  onClose: () => void;
}

export default function OrderPanel({ onClose }: OrderPanelProps) {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const fetchOrderItems = async () => {
    setIsLoading(true);
    try {
      const response = await window.electronAPI.requestItemListWithInfo();
      if (response && response.success && Array.isArray(response.data)) {
        setItems(response.data);
        const qtyMap: Record<string, string> = {};
        response.data.forEach((item: any) => {
          qtyMap[item.id] = item.quantity?.toString() || '1';
        });
        setQuantities(qtyMap);
      }
    } catch (error) {
      console.error('Failed to fetch order items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderItems();
  }, []);

  const handleQuantityChange = (id: string, value: string) => {
    setQuantities((prev) => ({ ...prev, [id]: value }));
  };

  const handleQuantityBlur = async (id: string, currentQty: number) => {
    const rawVal = quantities[id] ?? '';
    const newQtyVal = parseFloat(rawVal);
    if (isNaN(newQtyVal) || newQtyVal === currentQty) return;

    try {
      await window.electronAPI.requestItemEditQuantity({ id, newQuantity: newQtyVal });
      fetchOrderItems();
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await window.electronAPI.requestItemHardDelete(id);
      fetchOrderItems();
    } catch (error) {
      console.error('Failed to hard delete request item:', error);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--panel-bg, #ffffff)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '15px' }}>Order Panel</h3>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: 0 }}
        >
          ×
        </button>
      </div>

      {/* Content List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', boxSizing: 'border-box' }}>
        {isLoading ? (
          <p className="muted" style={{ fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
            Loading order items...
          </p>
        ) : items.length === 0 ? (
          <p className="muted" style={{ fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
            No active order details. Review and manage orders here.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '6px 10px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '4px',
                  background: 'var(--card-bg, #f8fafc)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  margin: 0,
                  boxSizing: 'border-box',
                }}
              >
                {/* Row 1: SKU Code */}
                <div style={{ margin: 0, lineHeight: 1.1 }}>
                  <span style={{ fontWeight: 600, fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                    {item.skuCode || 'N/A SKU'}
                  </span>
                </div>

                {/* Row 2: Variant Name, Editable Quantity, UOM, and Delete button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', margin: 0, lineHeight: 1.2 }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                    {item.variantName || 'Unnamed Variant'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, margin: 0 }}>
                    <input
                      type="text"
                      value={quantities[item.id] ?? item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      onBlur={() => handleQuantityBlur(item.id, item.quantity)}
                      style={{
                        width: '36px',
                        textAlign: 'center',
                        padding: '1px 3px',
                        height: '20px',
                        fontSize: '12px',
                        border: '1px solid var(--border-color, #cbd5e1)',
                        borderRadius: '3px',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                      {item.uomSymbol || ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      title="Delete Item"
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-color, #cbd5e1)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        height: '20px',
                        padding: '1px 5px',
                        fontSize: '10px',
                        color: '#ef4444',
                        marginLeft: '2px',
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>

                {/* Row 3: Comments */}
                {item.comments && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontStyle: 'italic', margin: 0, lineHeight: 1.1 }}>
                    {item.comments}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}