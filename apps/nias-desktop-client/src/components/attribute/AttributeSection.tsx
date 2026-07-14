import type { ReactNode } from 'react';

export type AttributeView = 'active' | 'deleted';

interface AttributeSectionProps<T> {
  title: string;
  addLabel: string;
  onAdd: () => void;
  view: AttributeView;
  onViewChange: (view: AttributeView) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  columns: string[];
  rows: T[];
  rowKey: (row: T) => string;
  renderRowCells: (row: T, isDeletedView: boolean) => ReactNode;
  emptyText: string;
  countLabel: string;
}

export default function AttributeSection<T>({
  title,
  addLabel,
  onAdd,
  view,
  onViewChange,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  columns,
  rows,
  rowKey,
  renderRowCells,
  emptyText,
  countLabel,
}: AttributeSectionProps<T>) {
  const isDeletedView = view === 'deleted';

  return (
    <section className="attribute-section">
      <div className="attribute-section-header">
        <h2>{title}</h2>
        <button className="primary" type="button" onClick={onAdd} disabled={isDeletedView}>
          {addLabel}
        </button>
      </div>

      <div className="attribute-toolbar">
        <div className="segment-toggle" role="group" aria-label={`${title} status filter`}>
          <button
            type="button"
            className={view === 'active' ? 'active' : ''}
            onClick={() => onViewChange('active')}
          >
            Active
          </button>
          <button
            type="button"
            className={view === 'deleted' ? 'active' : ''}
            onClick={() => onViewChange('deleted')}
          >
            Deleted
          </button>
        </div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={`${title}-${column}`}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => <tr key={rowKey(row)}>{renderRowCells(row, isDeletedView)}</tr>)
            ) : (
              <tr>
                <td colSpan={columns.length} className="muted">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="attribute-count muted">{countLabel}</div>
    </section>
  );
}
