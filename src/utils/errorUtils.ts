type DeletionErrorBody = { error: string; reason: string; count: number; relatedEntity: string };

function isDeletionError(data: unknown): data is DeletionErrorBody {
  return typeof data === 'object' && data !== null && 'error' in data && (data as DeletionErrorBody).error === 'DELETION_BLOCKED';
}

export function extractApiError(e: unknown, fallback: string): string {
  const data = (e as { response?: { data?: unknown } }).response?.data;
  if (isDeletionError(data)) return data.reason;
  if (typeof data === 'string' && data.length > 0) return data;
  return fallback;
}
