import { useAnalyticsQuery } from '@databricks/appkit-ui/react';
import { sql } from '@databricks/appkit-ui/js';
import { KpiCard } from './KpiCard';
import { ErrorBlock } from './states';
import { formatDate, formatDateTime, formatInt, toNumber } from '../lib/format';
import { useRefresh } from '../lib/refresh-context';

/** Linha de 4 KPIs do funil: recebidos → classificados → na fila → contatados. */
export function KpiRow() {
  const { versao } = useRefresh();
  const { data, loading, error } = useAnalyticsQuery('kpis_dia', { atualizacao: sql.int(versao) });
  const k = data?.[0];

  if (error) return <ErrorBlock message={error} />;

  const recebidos = toNumber(k?.recebidos);
  const classificados = toNumber(k?.classificados);
  const naFila = toNumber(k?.na_fila);
  const contatados = toNumber(k?.contatados);
  const compra = toNumber(k?.compra_imediata);
  const compraFora = toNumber(k?.compra_imediata_fora);
  const compraNaFila = compra - compraFora;
  const isLoading = loading || !k;

  return (
    <section aria-label="Indicadores do dia" className="space-y-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          loading={isLoading}
          value={recebidos}
          label="Leads recebidos"
          part={classificados}
          total={recebidos}
          caption={`${formatInt(classificados)} únicos após deduplicar`}
          colorToken="--chart-cat-1"
        />
        <KpiCard
          loading={isLoading}
          value={classificados}
          label="Classificados pela IA"
          part={compra}
          total={classificados}
          caption={`${formatInt(compra)} de compra imediata`}
          colorToken="--chart-cat-8"
        />
        <KpiCard
          loading={isLoading}
          value={naFila}
          label="Na fila do dia"
          part={compraNaFila}
          total={naFila}
          caption={`${formatInt(compraNaFila)} de compra imediata · capacidade 20`}
          colorToken="--chart-cat-4"
        />
        <KpiCard
          loading={isLoading}
          value={contatados}
          label="Contatados"
          part={contatados}
          total={naFila}
          caption={`de ${formatInt(naFila)} leads da fila`}
          colorToken="--chart-cat-5"
        />
      </div>
      {k && (
        <p className="px-1 text-xs text-muted-foreground">
          Dia de referência {formatDate(k.dia_ref)} · atualizado {formatDateTime(k.atualizado_em)} · fonte gold.leads_classificados,
          gold.fila_do_dia, gold.feedback_contatos
        </p>
      )}
    </section>
  );
}
