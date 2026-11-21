import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  GenieChatInput,
  GenieChatMessageList,
  useGenieChat,
} from '@databricks/appkit-ui/react';
import { AlertCircle, Database, RotateCcw, Sparkles } from 'lucide-react';
import { EmptyBlock } from '../../components/states';
import { useWhoAmI } from '../../lib/use-whoami';

/** Roteiro da demo (PRD 2.8): perguntas que o agente deve responder. */
const PERGUNTAS = [
  'Quantos leads de compra imediata chegaram hoje?',
  'Quais leads de compra imediata ficaram fora da fila de hoje?',
  'Qual canal trouxe mais leads de compra imediata nesta semana?',
  'Quais leads citaram concorrente?',
  'Quantos leads da minha fila eu já contatei?',
];

const ATALHOS: Record<string, string> = { fora: PERGUNTAS[1] };

/** Agente (RF-16): chat Genie sobre as tabelas gold, com o SQL gerado sempre visível. */
export function AgentePage() {
  const me = useWhoAmI();
  const { messages, status, error, sendMessage, reset } = useGenieChat({ alias: 'default' });
  const location = useLocation();
  const enviouAtalho = useRef(false);
  const ocupado = status === 'streaming' || status === 'loading-history';

  // Atalho vindo de outras telas (ex.: card "compra imediata" da Visão do Gestor).
  // Vem pelo state da navegação: a URL fica livre para o useGenieChat guardar o conversationId.
  const estado = location.state as { pergunta?: string } | null;
  const atalho = ATALHOS[estado?.pergunta ?? ''];
  useEffect(() => {
    if (!atalho || enviouAtalho.current || status !== 'idle') return;
    // Envia depois que a montagem estabiliza; se o componente desmontar antes (StrictMode), cancela.
    const timer = setTimeout(() => {
      enviouAtalho.current = true;
      sendMessage(atalho);
    }, 300);
    return () => clearTimeout(timer);
  }, [atalho, sendMessage, status]);

  const ultimoSql = useMemo(() => {
    for (const m of [...messages].reverse()) {
      for (const a of m.attachments ?? []) if (a.query?.query) return a.query;
    }
    return null;
  }, [messages]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <section className="card-soft flex min-h-[640px] flex-col p-4 xl:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-2 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Converse com os dados dos leads</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{me?.email ?? 'Usuário conectado'}</Badge>
            <Button variant="ghost" size="sm" onClick={reset} disabled={messages.length === 0}>
              <RotateCcw className="mr-1 h-4 w-4" /> Nova conversa
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {messages.length === 0 && status === 'idle' ? (
            <div className="flex h-full items-center justify-center p-6">
              <EmptyBlock
                title="Pergunte em português"
                description="Escolha uma pergunta sugerida ao lado ou escreva a sua. O agente consulta gold.leads_classificados, gold.fila_do_dia e gold.feedback_contatos."
              />
            </div>
          ) : (
            <GenieChatMessageList messages={messages} status={status} className="h-full" />
          )}
        </div>

        {status === 'streaming' && <p className="px-2 py-1 text-xs text-muted-foreground">Analisando os dados…</p>}
        {status === 'error' && (
          <Alert variant="destructive" className="my-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error ?? 'O agente não conseguiu responder. Reformule a pergunta ou tente de novo.'}</AlertDescription>
          </Alert>
        )}

        <GenieChatInput onSend={sendMessage} disabled={ocupado} placeholder="Ex.: quais leads quentes ficaram fora da fila hoje?" />
        <p className="px-2 pt-2 text-[11px] text-muted-foreground">
          Resposta gerada por IA (Genie) a partir dos dados — confira o SQL gerado antes de tomar decisões. As consultas rodam com as
          suas permissões no Unity Catalog (on-behalf-of).
        </p>
      </section>

      <aside className="space-y-6 xl:col-span-4">
        <section className="card-soft p-5">
          <h2 className="mb-3 font-semibold text-foreground">Perguntas sugeridas</h2>
          <div className="space-y-2">
            {PERGUNTAS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={ocupado}
                onClick={() => sendMessage(p)}
                className="w-full rounded-xl border border-border px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-primary hover:bg-accent disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline">
              <Sparkles className="mr-1 h-3 w-3" /> Genie
            </Badge>
            <Badge variant="outline">
              <Database className="mr-1 h-3 w-3" /> SQL Warehouse
            </Badge>
          </div>
        </section>

        <section className="card-soft p-5">
          <h2 className="font-semibold text-foreground">SQL gerado</h2>
          <p className="mb-3 text-xs text-muted-foreground">{ultimoSql?.title ?? 'Como a última resposta foi calculada'}</p>
          {ultimoSql?.query ? (
            <pre className="max-h-80 overflow-auto rounded-xl bg-muted p-3 text-xs text-foreground">{ultimoSql.query}</pre>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma consulta ainda.</p>
          )}
        </section>
      </aside>
    </div>
  );
}
