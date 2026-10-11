import { useCallback, useEffect, useState } from 'react';
import type { Period, Plan } from '../types';
import { PeriodToggle } from '../components/PeriodToggle';
import { PlanCard } from '../components/PlanCard';
import { logger } from '../lib/logger';
import { EmptyView, ErrorView, LoadingView } from '../components/StateViews';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; plans: Plan[] };

interface Props {
  period: Period;
  onPeriodChange: (period: Period) => void;
  onOpen: (plan: Plan) => void;
  load: () => Promise<Plan[]>;
}

export function CatalogPage({ period, onPeriodChange, onOpen, load }: Props) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const run = useCallback(() => {
    setState({ status: 'loading' });
    load()
      .then((plans) => setState({ status: 'success', plans }))
      .catch((e: unknown) => {
        logger.error('catalog load failed', { error: e instanceof Error ? e.message : String(e) });
        setState({
          status: 'error',
          message: e instanceof Error ? e.message : 'Что-то пошло не так',
        });
      });
  }, [load]);

  useEffect(run, [run]);

  return (
    <section>
      <h1>Выберите рацион</h1>
      <PeriodToggle value={period} onChange={onPeriodChange} />
      {state.status === 'loading' && <LoadingView />}
      {state.status === 'error' && <ErrorView message={state.message} onRetry={run} />}
      {state.status === 'success' && state.plans.length === 0 && (
        <EmptyView text="Скоро будем в вашем городе" />
      )}
      {state.status === 'success' && state.plans.length > 0 && (
        <div className="grid">
          {state.plans.map((p) => (
            <PlanCard key={p.id} plan={p} period={period} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  );
}
