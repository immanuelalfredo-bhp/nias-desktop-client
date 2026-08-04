// OrderPanel.tsx
export default function OrderPanel({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        width: '320px',
        height: '100%',
        borderLeft: '1px solid var(--border-color, #e2e8f0)',
        background: 'var(--panel-bg, #ffffff)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px' }}>Order Panel</h3>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
        >
          ×
        </button>
      </div>
      <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
        <p className="muted" style={{ fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>
          No active order details. Review and manage orders here.
        </p>
      </div>
    </div>
  );
}