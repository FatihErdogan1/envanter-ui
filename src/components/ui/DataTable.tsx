import { ReactNode, useMemo, useState } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number | null | undefined;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  selectedId?: string | number | null;
  emptyText?: string;
}

type SortDirection = 'asc' | 'desc';

const collator = new Intl.Collator('tr', {
  numeric: true,
  sensitivity: 'base',
});

const preferredObjectKeys = ['name', 'username', 'productName', 'serialNumber', 'sku', 'email', 'description'];

function sortableText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const preferredValue = preferredObjectKeys
      .map((key) => record[key])
      .find((item) => item != null);

    if (preferredValue != null) return sortableText(preferredValue);
  }
  return '';
}

export default function DataTable<T extends object>({
  columns, data, rowKey, onRowClick, selectedId, emptyText = 'Veri bulunamadı.',
}: Props<T>) {
  const [sort, setSort] = useState<{ key: string; direction: SortDirection }>(() => ({
    key: columns[0]?.key ?? '',
    direction: 'desc',
  }));

  const sortedData = useMemo(() => {
    const sortColumn = columns.find((column) => column.key === sort.key) ?? columns[0];
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aValue = sortColumn.sortValue
        ? sortColumn.sortValue(a)
        : (a as Record<string, unknown>)[sortColumn.key];
      const bValue = sortColumn.sortValue
        ? sortColumn.sortValue(b)
        : (b as Record<string, unknown>)[sortColumn.key];

      const comparison = collator.compare(sortableText(aValue), sortableText(bValue));
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [columns, data, sort.direction, sort.key]);

  const handleSort = (key: string) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  return (
    <div className="overflow-auto border border-border">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((col) => {
              const isActive = sort.key === col.key;
              const indicator = isActive ? (sort.direction === 'desc' ? '▼' : '▲') : '↕';

              return (
                <th
                  key={col.key}
                  className="table-header whitespace-nowrap"
                  aria-sort={isActive ? (sort.direction === 'desc' ? 'descending' : 'ascending') : 'none'}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(col.key)}
                    className="flex w-full items-center justify-between gap-2 text-left"
                  >
                    <span>{col.header}</span>
                    <span className={isActive ? 'text-accent' : 'text-muted'} aria-hidden="true">
                      {indicator}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-cell text-center text-muted py-8">
                {emptyText}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => {
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
