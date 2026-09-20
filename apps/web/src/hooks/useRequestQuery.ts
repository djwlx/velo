import { useCallback, useEffect, useState } from 'react';

interface UseRequestQueryOptions<T> {
  enabled?: boolean;
  initialData?: T;
}

interface UseRequestQueryResult<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useRequestQuery<T>(
  queryFn: () => Promise<T>,
  options: UseRequestQueryOptions<T> = {}
): UseRequestQueryResult<T> {
  const { enabled = true, initialData } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  }, [queryFn]);

  useEffect(() => {
    if (enabled) {
      refetch();
    }
  }, [enabled, refetch]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
