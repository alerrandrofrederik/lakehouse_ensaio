import { useEffect, useState } from 'react';
import { useAnalyticsQuery, Badge, Skeleton } from '@databricks/appkit-ui/react';
import { sql } from '@databricks/appkit-ui/js';
import { Search } from 'lucide-react';
import { labelCanal, labelIntencao } from '../lib/format';

/** Busca de lead por nome, empresa ou e-mail (campo da faixa azul, como na referência). */
export function LeadSearch() {
  const [texto, setTexto] = useState('');
  const [termo, setTermo] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setTermo(texto.trim()), 350);
    return () => clearTimeout(t);
  }, [texto]);

  return (
    <div className="relative w-full max-w-md">
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar lead, empresa ou e-mail..."
        aria-label="Buscar lead"
        className="h-11 w-full rounded-xl border border-primary-foreground/20 bg-primary-foreground/15 px-4 pr-10 text-sm text-primary-foreground placeholder:text-primary-foreground/75 outline-none focus:bg-primary-foreground/25"
      />
      <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary-foreground/90" />
      {termo.length >= 2 && <SearchResults termo={termo} onPick={() => setTexto('')} />}
    </div>
  );
}

function SearchResults({ termo, onPick }: { termo: string; onPick: () => void }) {
  const { data, loading, error } = useAnalyticsQuery('busca_leads', { termo: sql.string(termo) });

  return (
    <div className="card-soft absolute left-0 right-0 top-12 z-30 max-h-80 overflow-auto p-2">
      {loading && (
        <div className="space-y-2 p-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      {error && <p className="p-2 text-sm text-destructive">Erro na busca: {error}</p>}
      {data && data.length === 0 && <p className="p-2 text-sm text-muted-foreground">Nenhum lead encontrado para “{termo}”.</p>}
      {data?.map((lead) => (
        <button
          key={lead.lead_id}
          type="button"
          onClick={onPick}
          className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-foreground">{lead.nome}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {lead.empresa} · {labelCanal(lead.canal)} · {lead.proximo_passo}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary">{labelIntencao(lead.intencao)}</Badge>
            <span className="text-sm font-semibold text-foreground">{lead.nota}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
