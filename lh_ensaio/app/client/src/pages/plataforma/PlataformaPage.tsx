import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useAnalyticsQuery } from '@databricks/appkit-ui/react';
import { Bot, Brain, Database, FileSpreadsheet, FolderInput, Layers, MonitorSmartphone, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../../components/states';
import { formatInt } from '../../lib/format';

const ETAPAS: { titulo: string; detalhe: string; icon: LucideIcon }[] = [
  { titulo: 'CSV do dia', detalhe: 'leads, empresas, oportunidades', icon: FileSpreadsheet },
  { titulo: 'Volume', detalhe: '/Volumes/lh_ensaio/bronze/landing', icon: FolderInput },
  { titulo: 'Bronze', detalhe: 'Auto Loader, dado como veio', icon: Layers },
  { titulo: 'Silver', detalhe: 'limpo, deduplicado e unido', icon: Database },
  { titulo: 'Gold', detalhe: 'ai_classify + ai_extract + nota', icon: Brain },
  { titulo: 'Genie', detalhe: 'perguntas em português', icon: Sparkles },
  { titulo: 'App', detalhe: 'fila do dia + agente', icon: MonitorSmartphone },
];

/** Plataforma: o caminho da fonte à decisão e o volume de dados em cada camada. */
export function PlataformaPage() {
  const { data, loading, error } = useAnalyticsQuery('camadas', {});

  return (
    <div className="space-y-6">
      <section className="card-soft p-6">
        <h2 className="text-lg font-semibold text-foreground">Da fonte à decisão</h2>
        <p className="mb-5 text-xs text-muted-foreground">Pipeline lead_score_pipeline (Lakeflow, serverless) · catálogo lh_ensaio</p>
        <ol className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {ETAPAS.map(({ titulo, detalhe, icon: Icon }, i) => (
            <li key={titulo} className="rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-3 font-medium text-foreground">{titulo}</p>
              <p className="text-xs text-muted-foreground">{detalhe}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="card-soft p-6 xl:col-span-7">
          <h2 className="text-lg font-semibold text-foreground">Linhas por camada</h2>
          <p className="mb-4 text-xs text-muted-foreground">Contagem atual de cada tabela do medalhão</p>
          {loading && <LoadingBlock lines={5} />}
          {error && <ErrorBlock message={error} />}
          {data && data.length === 0 && <EmptyBlock title="Sem tabelas" />}
          {data && data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Camada</TableHead>
                  <TableHead>Tabela</TableHead>
                  <TableHead className="text-right">Linhas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((c) => (
                  <TableRow key={c.tabela}>
                    <TableCell className="font-medium">{c.camada}</TableCell>
                    <TableCell className="font-mono text-xs">lh_ensaio.{c.tabela}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatInt(c.linhas)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        <section className="card-soft space-y-4 p-6 xl:col-span-5">
          <h2 className="text-lg font-semibold text-foreground">Como a nota é calculada</h2>
          <p className="rounded-xl bg-muted p-3 font-mono text-xs text-foreground">
            nota = 0,50 × intenção + 0,25 × perfil + 0,15 × sinais + 0,10 × recência
          </p>
          <ul className="space-y-2 text-sm text-foreground">
            <li>
              <b>Intenção</b> (ai_classify): compra imediata 100 · avaliando 40 · suporte e spam 0
            </li>
            <li>
              <b>Perfil</b>: porte grande 100 · médio 60 · pequeno 30 · desconhecido 20, +20 se já é cliente
            </li>
            <li>
              <b>Sinais</b> (ai_extract): +40 orçamento aprovado · +30 prazo · +30 quantidade
            </li>
            <li>
              <b>Recência</b>: 100 no dia · 50 no dia seguinte · 25 em dois dias · 0 depois
            </li>
          </ul>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Bot className="mt-0.5 h-4 w-4 shrink-0" />
            A IA sugere, o vendedor decide. Spam vai para “Descartar” e suporte para “Encaminhar ao suporte”, sempre fora da fila.
          </p>
        </section>
      </div>
    </div>
  );
}
