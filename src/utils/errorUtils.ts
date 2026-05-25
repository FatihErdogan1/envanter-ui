type DeletionErrorBody = { error: string; reason: string; count: number; relatedEntity: string };

function isDeletionError(data: unknown): data is DeletionErrorBody {
  return typeof data === 'object' && data !== null && 'error' in data && (data as DeletionErrorBody).error === 'DELETION_BLOCKED';
}

export function extractApiError(e: unknown, fallback: string): string {
  const err = e as { userMessage?: string; response?: { data?: unknown } };
  if (err.userMessage) return err.userMessage;
  const data = err.response?.data;
  if (isDeletionError(data)) return data.reason;
  if (typeof data === 'object' && data !== null && 'message' in data)
    return String((data as { message: string }).message);
  if (typeof data === 'string' && data.length > 0) return data;
  return fallback;
}
