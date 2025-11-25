'use client';

import * as React from 'react';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseApiOptions {
  immediate?: boolean;
}

export function useApi<T>(
  fetcher: () => Promise<{ data: T }>,
  options: UseApiOptions = {}
) {
  const { immediate = true } = options;
  const [state, setState] = React.useState<UseApiState<T>>({
    data: null,
    isLoading: immediate,
    error: null,
  });

  const execute = React.useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetcher();
      setState({ data: response.data, isLoading: false, error: null });
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setState({ data: null, isLoading: false, error });
      throw error;
    }
  }, [fetcher]);

  const refetch = React.useCallback(() => {
    return execute();
  }, [execute]);

  React.useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    ...state,
    execute,
    refetch,
  };
}

interface UseMutationState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export function useMutation<T, TVariables = void>(
  mutator: (variables: TVariables) => Promise<{ data: T }>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const [state, setState] = React.useState<UseMutationState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const mutate = React.useCallback(
    async (variables: TVariables) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const response = await mutator(variables);
        setState({ data: response.data, isLoading: false, error: null });
        options?.onSuccess?.(response.data);
        return response.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An error occurred');
        setState({ data: null, isLoading: false, error });
        options?.onError?.(error);
        throw error;
      }
    },
    [mutator, options]
  );

  const reset = React.useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}
