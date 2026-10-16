import { useState } from 'react';
import type { DayRevenue } from '../lib/charts';
import { formatCompact, niceScale } from '../lib/charts';
import type { PlanSales } from '../lib/orders';
import { formatRub } from '../lib/pricing';

const W = 600;

const dayFmt = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' });
const fullFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

function parseDay(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

interface TooltipProps {
  /** Position inside the chart, in percent of its width/height. */
  left: number;
  top: number;
  title: string;
  lines: readonly string[];
}

function Tooltip({ left, top, title, lines }: TooltipProps) {
  // Keep the tooltip inside the chart: open downwards near the top, shift sideways near the edges.
  const x = left < 18 ? '0%' : left > 82 ? '-100%' : '-50%';
  const y = top < 40 ? '12px' : 'calc(-100% - 12px)';
  return (
    <div
      className="chart__tip"
      role="status"
      style={{ left: `${left}%`, top: `${top}%`, transform: `translate(${x}, ${y})` }}
      data-testid="chart-tip"
    >
      <strong>{title}</strong>
      {lines.map((l) => (
        <span key={l}>{l}</span>
      ))}
    </div>
  );
}

/** Revenue of placed orders per day: one 2px line, a light wash, hover crosshair + tooltip. */
export function RevenueLineChart({ days }: { days: readonly DayRevenue[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (days.length === 0) {
    return <p className="muted">Оформленных заказов для графика пока нет</p>;
  }

  const H = 220;
  const ml = 66;
  const mr = 24;
  const mt = 24;
  const mb = 32;
  const plotW = W - ml - mr;
  const plotH = H - mt - mb;
  const n = days.length;
  const peak = days.reduce((best, d, i) => (d.revenue > days[best].revenue ? i : best), 0);
  const { ticks, top } = niceScale(days[peak].revenue);

  const x = (i: number) => (n === 1 ? ml + plotW / 2 : ml + (i * plotW) / (n - 1));
  const y = (v: number) => mt + plotH - (v / top) * plotH;
  const step = n === 1 ? plotW : plotW / (n - 1);

  const points = days.map((d, i) => `${x(i).toFixed(1)},${y(d.revenue).toFixed(1)}`);
  const line = `M${points.join(' L')}`;
  const area = `${line} L${x(n - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const labelAt = new Set(
    n < 4 ? days.map((_, i) => i) : [0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1],
  );
  const active = hover === null ? null : days[hover];

  return (
    <figure className="chart">
      <div className="chart__plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Выручка по дням: за ${n} дн., пик ${formatRub(days[peak].revenue)}`}
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={ml} x2={W - mr} y1={y(t)} y2={y(t)} className="chart__grid" />
              <text x={ml - 8} y={y(t) + 5} textAnchor="end" className="chart__tick">
                {formatCompact(t)}
              </text>
            </g>
          ))}
          <line x1={ml} x2={W - mr} y1={y(0)} y2={y(0)} className="chart__axis" />
          {days.map(
            (d, i) =>
              labelAt.has(i) && (
                <text key={d.date} x={x(i)} y={H - 6} textAnchor="middle" className="chart__tick">
                  {dayFmt.format(parseDay(d.date))}
                </text>
              ),
          )}

          {n > 1 && <path d={area} className="chart__area" />}
          {n > 1 && <path d={line} className="chart__line" />}

          {active && hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={mt} y2={y(0)} className="chart__axis" />
          )}
          <circle
            cx={x(hover ?? peak)}
            cy={y(days[hover ?? peak].revenue)}
            r={4}
            className="chart__dot"
          />
          {hover === null && days[peak].revenue > 0 && (
            <text
              x={Math.min(x(peak), W - mr)}
              y={y(days[peak].revenue) - 10}
              textAnchor={peak > n / 2 ? 'end' : 'middle'}
              className="chart__value"
            >
              {formatRub(days[peak].revenue)}
            </text>
          )}

          {days.map((d, i) => (
            <rect
              key={d.date}
              x={x(i) - step / 2}
              y={mt}
              width={step}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseMove={() => setHover(i)}
            />
          ))}
        </svg>
        {active && hover !== null && (
          <Tooltip
            left={(x(hover) / W) * 100}
            top={(y(active.revenue) / H) * 100}
            title={fullFmt.format(parseDay(active.date))}
            lines={[`Выручка: ${formatRub(active.revenue)}`, `Заказов: ${active.orders}`]}
          />
        )}
      </div>
    </figure>
  );
}

/** Revenue per plan: horizontal bars (<= 24px, 4px rounded tip), value at the tip, hover tooltip. */
export function PlanBarChart({ sales }: { sales: readonly PlanSales[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (sales.length === 0) {
    return <p className="muted">Оформленных заказов пока нет</p>;
  }

  const ml = 96;
  const mr = 110;
  const rowH = 40;
  const thick = 20;
  const radius = 4;
  const H = sales.length * rowH + 8;
  const max = Math.max(...sales.map((s) => s.revenue), 1);
  const total = sales.reduce((sum, s) => sum + s.revenue, 0);
  const barW = (v: number) => Math.max((v / max) * (W - ml - mr), 4);
  const rowY = (i: number) => 4 + i * rowH + (rowH - thick) / 2;

  /** A bar that grows from the baseline: square at the axis, rounded at the data end. */
  const barPath = (i: number, w: number) => {
    const r = Math.min(radius, w / 2);
    const y0 = rowY(i);
    return `M${ml},${y0} h${w - r} a${r},${r} 0 0 1 ${r},${r} v${thick - 2 * r} a${r},${r} 0 0 1 -${r},${r} h-${w - r} Z`;
  };

  const active = hover === null ? null : sales[hover];

  return (
    <figure className="chart">
      <div className="chart__plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Выручка по рационам: лидер ${sales[0].planName}, ${formatRub(sales[0].revenue)}`}
          onMouseLeave={() => setHover(null)}
        >
          <line x1={ml} x2={ml} y1={4} y2={H - 4} className="chart__axis" />
          {sales.map((s, i) => (
            <g key={s.planId} opacity={hover === null || hover === i ? 1 : 0.45}>
              <text x={ml - 10} y={rowY(i) + thick / 2 + 4} textAnchor="end" className="chart__label">
                {s.planName}
              </text>
              <path d={barPath(i, barW(s.revenue))} className="chart__bar" />
              <text
                x={ml + barW(s.revenue) + 8}
                y={rowY(i) + thick / 2 + 4}
                className="chart__value"
              >
                {formatRub(s.revenue)}
              </text>
            </g>
          ))}
          {sales.map((s, i) => (
            <rect
              key={s.planId}
              x={0}
              y={4 + i * rowH}
              width={W}
              height={rowH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseMove={() => setHover(i)}
            />
          ))}
        </svg>
        {active && hover !== null && (
          <Tooltip
            left={((ml + barW(active.revenue)) / W) * 100}
            top={((rowY(hover) + thick / 2) / H) * 100}
            title={active.planName}
            lines={[
              `Выручка: ${formatRub(active.revenue)}`,
              `Штук: ${active.qty}`,
              `Доля: ${total === 0 ? 0 : Math.round((active.revenue / total) * 100)}%`,
            ]}
          />
        )}
      </div>
    </figure>
  );
}
