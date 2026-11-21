import { useNavigate } from 'react-router';
import {
  AreaChart,
  Avatar,
  AvatarFallback,
  BarChart,
  Button,
  useAnalyticsQuery,
} from '@databricks/appkit-ui/react';
import { sql } from '@databricks/appkit-ui/js';
import { ArrowRight } from 'lucide-react';
import { KpiRow } from '../../components/KpiRow';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../../components/states';
import { CATEGORICAL_TOKENS, formatInt, initials, labelCanal, toNumber } from '../../lib/format';
import { useCssColors } from '../../lib/use-css-colors';
import { useRefresh } from '../../lib/refresh-context';

/** Visão do Gestor (RF-15): mesmo arranjo da referência — KPIs, série temporal, barras por canal, lista, destaque e UF. */
export function GestorPage() {
  return (
    <div className="space-y-6">
      <KpiRow />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <LeadsPorHora />
        <CompraPorCanal />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-12">
        <TopDaFila />
        <DestaqueCompraImediata />
        <LeadsPorUf />
      </div>
    </div>
  );
}

function Panel({ title, subtitle, className, children, action }: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className={`card-soft p-6 ${className ?? ''}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function LeadsPorHora() {
  const colors = useCssColors(['--chart-cat-1', '--chart-cat-4']);
  return (
    <Panel
      className="xl:col-span-8"
      title="Leads por hora"
      subtitle="Recebidos vs. compra imediata no dia de referência · gold.leads_classificados"
    >
      <AreaChart
        queryKey="leads_por_hora"
        parameters={{}}
        xKey="hora"
        yKey={['recebidos', 'compra_imediata']}
        smooth
        colors={colors}
        height={300}
        showLegend
        ariaLabel="Leads recebidos e de compra imediata por hora"
        valueFormatter={(v) => formatInt(v)}
      />
    </Panel>
  );
}

function CompraPorCanal() {
  const { data, loading, error } = useAnalyticsQuery('leads_por_canal', {});
  const max = Math.max(1, ...(data ?? []).map((c) => toNumber(c.pct_compra_imediata)));

  return (
    <Panel className="xl:col-span-4" title="Compra imediata por canal" subtitle="% dos leads do canal com intenção de compra imediata">
      {loading && <LoadingBlock lines={5} />}
      {error && <ErrorBlock message={error} />}
      {data && data.length === 0 && <EmptyBlock title="Sem leads no dia" />}
      <ul className="space-y-5">
        {data?.map((c, i) => {
          const pct = toNumber(c.pct_compra_imediata);
          const token = CATEGORICAL_TOKENS[i % CATEGORICAL_TOKENS.length];
          return (
            <li key={c.canal}>
              <div className="mb-2 flex items-baseline justify-between text-sm">
                <span className="font-medium text-foreground">{labelCanal(c.canal)}</span>
                <span className="tabular-nums text-foreground">
                  {pct.toLocaleString('pt-BR')}%{' '}
                  <span className="text-xs text-muted-foreground">
                    ({formatInt(c.compra_imediata)} de {formatInt(c.total)})
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: `color-mix(in oklch, var(${token}) 18%, transparent)` }}>
                <div className="h-2 rounded-full" style={{ width: `${(100 * pct) / max}%`, backgroundColor: `var(${token})` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function TopDaFila() {
  const navigate = useNavigate();
  const { versao } = useRefresh();
  const { data, loading, error } = useAnalyticsQuery('fila_do_dia', {
    vendedor: sql.string(''),
    atualizacao: sql.int(versao),
  });
  const top = data?.slice(0, 4);

  return (
    <Panel
      className="xl:col-span-5"
      title="Topo da fila"
      subtitle="Os leads de maior nota hoje · gold.fila_do_dia"
      action={
        <Button variant="outline" size="sm" onClick={() => void navigate('/fila')}>
          Ver fila <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      }
    >
      {loading && <LoadingBlock lines={4} />}
      {error && <ErrorBlock message={error} />}
      {data && data.length === 0 && <EmptyBlock title="Fila vazia" description="Rode o pipeline para gerar a fila do dia." />}
      <ul className="space-y-4">
        {top?.map((lead) => (
          <li key={lead.lead_id} className="flex items-center gap-4">
            <Avatar className="h-14 w-14 rounded-xl">
              <AvatarFallback className="rounded-xl bg-accent text-accent-foreground">{initials(lead.nome)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{lead.nome}</p>
              <p className="truncate text-xs text-muted-foreground">
                {lead.empresa} · {lead.vendedor}
              </p>
              <p className="truncate text-xs text-muted-foreground">{lead.motivo}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-semibold tabular-nums" style={{ color: 'var(--chart-cat-4)' }}>
                {lead.nota}
              </p>
              <p className="text-[11px] text-muted-foreground">nota</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function DestaqueCompraImediata() {
  const navigate = useNavigate();
  const { versao } = useRefresh();
  const { data, loading, error } = useAnalyticsQuery('kpis_dia', { atualizacao: sql.int(versao) });
  const fila = useAnalyticsQuery('fila_do_dia', { vendedor: sql.string(''), atualizacao: sql.int(versao) });
  const k = data?.[0];
  const avatares = (fila.data ?? []).slice(0, 4).map((l) => ({ id: l.lead_id, sigla: initials(l.nome) }));
  const posicoes = ['left-4 top-4', 'right-6 top-6', 'left-6 bottom-24', 'right-4 bottom-28'];

  return (
    <section className="relative flex min-h-80 flex-col items-center justify-end overflow-hidden rounded-[calc(var(--radius)+0.25rem)] bg-primary p-6 text-center text-primary-foreground xl:col-span-3">
      {avatares.map(({ id, sigla }, i) => (
        <span
          key={id}
          className={`absolute ${posicoes[i]} flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary-foreground/50 bg-primary-foreground/20 text-xs font-semibold`}
        >
          {sigla}
        </span>
      ))}
      {loading && <LoadingBlock lines={2} />}
      {error && <p className="text-sm">Erro: {error}</p>}
      {k && (
        <>
          <p className="text-6xl font-bold tabular-nums">{formatInt(k.compra_imediata)}</p>
          <p className="mt-1 text-lg">leads de compra imediata</p>
          <p className="mt-2 text-sm text-primary-foreground/85">
            {formatInt(k.compra_imediata_fora)} ficaram fora da fila de hoje
          </p>
          <Button
            size="sm"
            className="mt-4 bg-warning text-warning-foreground hover:bg-warning/90"
            onClick={() => void navigate('/agente', { state: { pergunta: 'fora' } })}
          >
            Perguntar ao agente
          </Button>
        </>
      )}
    </section>
  );
}

function LeadsPorUf() {
  const colors = useCssColors(['--chart-cat-1', '--chart-cat-4']);
  return (
    <Panel className="md:col-span-2 xl:col-span-4" title="Leads por UF" subtitle="8 UFs com mais leads · compra imediata em destaque">
      <BarChart
        queryKey="leads_por_uf"
        parameters={{}}
        xKey="uf"
        yKey={['leads', 'compra_imediata']}
        orientation="horizontal"
        colors={colors}
        height={300}
        showLegend
        ariaLabel="Leads por UF"
      />
    </Panel>
  );
}
