import { useCallback, useEffect, useState } from 'react';
import { logger } from '../lib/logger';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

/** Runs `load` on mount and whenever `load` changes; `reload` repeats it. */
export function useAsync<T>(load: () => Promise<T>): { state: AsyncState<T>; reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    load()
      .then((data) => setState({ status: 'success', data }))
      .catch((e: unknown) => {
        logger.error('load failed', { error: e instanceof Error ? e.message : String(e) });
        setState({
          status: 'error',
          message: e instanceof Error ? e.message : 'Что-то пошло не так',
        });
      });
  }, [load]);

  useEffect(reload, [reload]);
  return { state, reload };
}
