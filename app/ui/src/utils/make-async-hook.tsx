import { useCallback, useEffect, useMemo, useRef, useState, createContext, useContext, PropsWithChildren } from 'react';

type AnyAsyncFn = (...args: any[]) => Promise<any>;

type ArgsOf<F extends AnyAsyncFn> = Parameters<F>;
type AwaitedReturnOf<F extends AnyAsyncFn> = Awaited<ReturnType<F>>;

export type AsyncHookState<T> = {
  data: T;
  error: unknown | null;
  loading: boolean;
  refetch: (updateLoadingState?: boolean) => Promise<void>;
  mutate: (updater: (current: T) => T) => void;
  optimisticUpdate: <R>(
    updater: (current: T) => T,
    asyncFn: () => Promise<R>
  ) => Promise<R>;
};

export type AsyncHookProps<F extends AnyAsyncFn> = {
  args: ArgsOf<F>;
  initialValue: AwaitedReturnOf<F>;
  enabled?: boolean;
};

export function useAsync<F extends AnyAsyncFn>(
  fn: F,
  props: AsyncHookProps<F>
): AsyncHookState<AwaitedReturnOf<F>> {
  const { args, initialValue, enabled = true } = props;

  const [data, setData] = useState<AwaitedReturnOf<F>>(initialValue);
  const [error, setError] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);

  const key = useMemo(() => JSON.stringify(args), [args]);

  const run = async (updateLoadingState: boolean = true) => {
    setLoading(updateLoadingState);
    setError(null);
    try {
      const res = await fn(...(args as ArgsOf<F>));
      setData((res ?? initialValue) as AwaitedReturnOf<F>);
      hasLoadedRef.current = true;
    } catch (e) {
      setError(e);
      setData(initialValue);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;
    void run(!hasLoadedRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key]);

  // Direct mutation of data (for manual control)
  const mutate = useCallback((updater: (current: AwaitedReturnOf<F>) => AwaitedReturnOf<F>) => {
    setData(current => updater(current));
  }, []);

  // Optimistic update: apply change immediately, then execute async operation
  // If async operation fails, revert to previous state
  const optimisticUpdate = useCallback(
    async <R,>(
      updater: (current: AwaitedReturnOf<F>) => AwaitedReturnOf<F>,
      asyncFn: () => Promise<R>
    ): Promise<R> => {
      const previousData = data;

      // Apply optimistic update immediately
      setData(current => updater(current));
      setError(null);

      try {
        return await asyncFn();
      } catch (e) {
        // Revert to previous state on error
        setData(previousData);
        setError(e);
        throw e;
      }
    },
    [data]
  );

  return { data, error, loading, refetch: run, mutate, optimisticUpdate };
}

// ============================================================================
// Async Query Context Provider
// ============================================================================

/**
 * Context for sharing async query state without prop drilling
 * Stores all return values from useAsync hook
 */
const AsyncQueryContext = createContext<AsyncHookState<any> | undefined>(undefined);

/**
 * Provider component that wraps the async query state
 * Provides access to data, error, loading, refetch, mutate, and optimisticUpdate
 */
interface AsyncQueryProviderProps<T> extends PropsWithChildren {
  value: AsyncHookState<T>;
}

export const AsyncQueryProvider = function<T>({ value, children }: AsyncQueryProviderProps<T>) {
  return (
    <AsyncQueryContext.Provider value={value}>
      {children}
    </AsyncQueryContext.Provider>
  );
}

/**
 * Typed hook to access the async query context
 *
 * @throws Error if used outside of AsyncQueryProvider
 * @returns The complete AsyncHookState with data, error, loading, refetch, mutate, and optimisticUpdate
 */
export function useAsyncCtx<T>(): AsyncHookState<T> {
  const context = useContext(AsyncQueryContext);

  if (context === undefined) {
    throw new Error('useAsyncCtx must be used within an AsyncQueryProvider');
  }

  return context as AsyncHookState<T>;
}

