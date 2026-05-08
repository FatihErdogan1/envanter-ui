import { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  selectedId?: string | number | null;
  emptyText?: string;
}

export default function DataTable<T extends object>({
  columns, data, rowKey, onRowClick, selectedId, emptyText = 'Veri bulunamadı.',
}: Props<T>) {
  return (
    <div className="overflow-auto border border-border">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="table-header whitespace-nowrap">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-cell text-center text-muted py-8">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const id = rowKey(row);
              return (
                <tr
                  key={id}
                  onClick={() => onRowClick?.(row)}
                  className={`table-row ${selectedId === id ? 'table-row-selected' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="table-cell whitespace-nowrap">
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
