import { useState } from 'react';
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useAnalyticsQuery,
} from '@databricks/appkit-ui/react';
import { sql } from '@databricks/appkit-ui/js';
import { Check, Mail, Phone } from 'lucide-react';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../../components/states';
import { formatDateTime, initials, labelCanal, labelIntencao, toNumber } from '../../lib/format';
import { useRefresh } from '../../lib/refresh-context';

type FilaRow = NonNullable<ReturnType<typeof useFila>['data']>[number];

const TODOS = '__todos__';

function useFila(vendedor: string, versao: number) {
  return useAnalyticsQuery('fila_do_dia', {
    vendedor: sql.string(vendedor === TODOS ? '' : vendedor),
    atualizacao: sql.int(versao),
  });
}

/** Fila do Dia (RF-13, RF-14): os 5 leads de cada vendedor, com o porquê e o próximo passo. */
export function FilaPage() {
  const [vendedor, setVendedor] = useState<string>(TODOS);
  const { versao } = useRefresh();
  const vendedores = useAnalyticsQuery('vendedores', {});
  const { data, loading, error } = useFila(vendedor, versao);
  const contatados = (data ?? []).filter((l) => l.contatado_em).length;

  return (
    <div className="space-y-6">
      <section className="card-soft flex flex-wrap items-end justify-between gap-4 p-5">
        <div className="space-y-2">
          <Label htmlFor="vendedor">Vendedor</Label>
          <Select value={vendedor} onValueChange={setVendedor}>
            <SelectTrigger id="vendedor" className="w-64">
              <SelectValue placeholder="Todos os vendedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os vendedores</SelectItem>
              {vendedores.data?.map((v) => (
                <SelectItem key={v.vendedor_id} value={v.vendedor}>
                  {v.vendedor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {data && (
          <div className="flex gap-6 text-sm">
            <Resumo valor={data.length} rotulo="leads na fila" />
            <Resumo valor={contatados} rotulo="contatados" />
            <Resumo valor={data.length - contatados} rotulo="a contatar" />
          </div>
        )}
      </section>

      {loading && (
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="card-soft p-6">
              <LoadingBlock lines={6} />
            </div>
          ))}
        </div>
      )}
      {error && <ErrorBlock message={error} />}
      {data && data.length === 0 && (
        <div className="card-soft p-6">
          <EmptyBlock title="Nenhum lead na fila" description="A fila é gerada pelo pipeline lead_score_pipeline." />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {data?.map((lead) => (
          <LeadCard key={lead.lead_id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

function Resumo({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums text-foreground">{valor}</p>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
    </div>
  );
}

const COMPONENTES = [
  { key: 'c_intencao', label: 'Intenção', peso: '50%' },
  { key: 'c_perfil', label: 'Perfil', peso: '25%' },
  { key: 'c_sinais', label: 'Sinais', peso: '15%' },
  { key: 'c_recencia', label: 'Recência', peso: '10%' },
] as const;

function LeadCard({ lead }: { lead: FilaRow }) {
  const { atualizar } = useRefresh();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const entidades = [
    lead.produto && `Produto: ${lead.produto}`,
    lead.qtd_licencas !== null && lead.qtd_licencas !== undefined && `${lead.qtd_licencas} licenças`,
    lead.prazo && `Prazo: ${lead.prazo}`,
    lead.orcamento_aprovado && 'Orçamento aprovado',
    lead.concorrente_citado && `Concorrente: ${lead.concorrente_citado}`,
  ].filter((e): e is string => Boolean(e));

  async function marcarContatado() {
    setSalvando(true);
    setErro(null);
    try {
      const resp = await fetch('/api/contatado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.lead_id, vendedor: lead.vendedor }),
      });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }
      atualizar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao registrar o contato');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <article className="card-soft flex flex-col gap-4 p-6">
      <header className="flex items-start gap-4">
        <Avatar className="h-12 w-12 rounded-xl">
          <AvatarFallback className="rounded-xl bg-accent text-accent-foreground">{initials(lead.nome)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">#{lead.posicao}</span>
            <h3 className="truncate font-semibold text-foreground">{lead.nome}</h3>
            <Badge variant={lead.intencao === 'compra_imediata' ? 'default' : 'secondary'}>{labelIntencao(lead.intencao)}</Badge>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {[lead.cargo, lead.empresa, lead.porte !== 'desconhecido' ? `porte ${lead.porte}` : null, lead.uf]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="text-xs text-muted-foreground">
            {labelCanal(lead.canal)} · {lead.vendedor} · recebido {formatDateTime(lead.recebido_em)}
          </p>
        </div>
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <span className="text-2xl font-bold tabular-nums leading-none">{lead.nota}</span>
          <span className="text-[10px] uppercase tracking-wide opacity-80">nota</span>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-3" aria-label="Componentes da nota">
        {COMPONENTES.map((c) => {
          const v = toNumber(lead[c.key]);
          return (
            <div key={c.key}>
              <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                <span>
                  {c.label} <span className="opacity-70">{c.peso}</span>
                </span>
                <span className="tabular-nums text-foreground">{v}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted">
                <div className="h-1.5 rounded-full bg-primary" style={{ width: `${v}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-muted p-3">
        <p className="text-xs font-medium text-muted-foreground">Por que está na fila</p>
        <p className="text-sm text-foreground">{lead.motivo || 'Sem sinais extraídos da mensagem.'}</p>
        {entidades.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {entidades.map((e) => (
              <Badge key={e} variant="outline">
                {e}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <blockquote className="border-l-2 border-primary pl-3 text-sm italic text-muted-foreground">“{lead.mensagem}”</blockquote>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Próximo passo</p>
          <p className="font-medium text-foreground">{lead.proximo_passo}</p>
          <p className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {lead.telefone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" /> {lead.telefone}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" /> {lead.email}
            </span>
          </p>
        </div>
        {lead.contatado_em ? (
          <Badge className="bg-success text-success-foreground">
            <Check className="mr-1 h-3 w-3" /> Contatado {formatDateTime(lead.contatado_em)}
          </Badge>
        ) : (
          <Button onClick={() => void marcarContatado()} disabled={salvando}>
            {salvando ? 'Registrando…' : 'Marcar como contatado'}
          </Button>
        )}
      </footer>
      {erro && <p className="text-sm text-destructive">Não foi possível registrar: {erro}</p>}
    </article>
  );
}
