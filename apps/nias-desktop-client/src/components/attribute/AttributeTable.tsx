import type { AttributeEntityDefinition } from './attributeFactory';

interface TableRow {
  id: string;
  deletedAt?: string | null;
  [key: string]: unknown;
}

interface AttributeTableProps {
  definition: AttributeEntityDefinition;
  rows: TableRow[];
  totalActive: number;
  totalDeleted: number;
  onEdit: (row: TableRow) => void;
  onDelete: (row: TableRow) => void;
  onRestore: (row: TableRow) => void;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  return String(value);
}

export default function AttributeTable({
  definition,
  rows,
  totalActive,
  totalDeleted,
  onEdit,
  onDelete,
  onRestore,
}: AttributeTableProps) {
  return (
    <section className="attribute-table-card">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {definition.columns.map((column) => (
                <th key={`${definition.key}-${column.key}`}>{column.label}</th>
              ))}
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={definition.columns.length + 2} className="muted">
                  No {definition.label.toLowerCase()} found.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isDeleted = Boolean(row.deletedAt);

                return (
                  <tr key={row.id} className={isDeleted ? 'attribute-row deleted' : 'attribute-row'}>
                    {definition.columns.map((column) => (
                      <td key={`${row.id}-${column.key}`}>{displayValue(row[column.key])}</td>
                    ))}
                    <td>{isDeleted ? 'Deleted' : 'Active'}</td>
                    <td>
                      <div className="inline-actions">
                        {isDeleted ? (
                          <button className="secondary" type="button" onClick={() => onRestore(row)}>
                            Restore
                          </button>
                        ) : (
                          <>
                            <button className="secondary" type="button" onClick={() => onEdit(row)}>
                              Edit
                            </button>
                            <button className="danger" type="button" onClick={() => onDelete(row)}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="attribute-count muted">
        Active: {totalActive} | Deleted: {totalDeleted} | Showing: {rows.length}
      </div>
    </section>
  );
}
