import { DonutChart, Skeleton } from '@databricks/appkit-ui/react';
import { useCssColors } from '../lib/use-css-colors';
import { formatInt, formatPct } from '../lib/format';

interface KpiCardProps {
  value: number | null;
  label: string;
  /** Parte (numerador) do anel, comparada com o total. */
  part: number;
  total: number;
  /** Texto de comparação abaixo do rótulo (ex.: "290 únicos · 97%"). */
  caption: string;
  colorToken: string;
  loading?: boolean;
}

/** Card de KPI da referência: número grande, rótulo e anel (donut) à direita. */
export function KpiCard({ value, label, part, total, caption, colorToken, loading }: KpiCardProps) {
  const [color, track] = useCssColors([colorToken, '--muted']);
  const resto = Math.max(total - part, 0);
  const pct = total > 0 ? (100 * part) / total : 0;

  return (
    <div className="card-soft flex items-center justify-between gap-3 p-5">
      <div className="min-w-0">
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-3xl font-semibold tabular-nums text-foreground">{value === null ? '—' : formatInt(value)}</p>
        )}
        <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{loading ? ' ' : caption}</p>
      </div>
      <div className="relative h-20 w-20 shrink-0" aria-label={`${label}: ${formatPct(pct)}`}>
        {!loading && (
          <>
            <DonutChart
              data={[
                { parte: 'atingido', valor: part },
                { parte: 'restante', valor: resto },
              ]}
              xKey="parte"
              yKey="valor"
              colors={[color, track]}
              innerRadius={62}
              showLabels={false}
              showLegend={false}
              height={80}
              ariaLabel={label}
              options={{ tooltip: { show: false } }}
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums text-foreground">
              {formatPct(pct)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
