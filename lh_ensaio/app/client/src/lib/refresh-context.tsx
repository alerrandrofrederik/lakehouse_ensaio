import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Contador de atualização compartilhado. As consultas que dependem de gold.feedback_contatos
 * recebem esse valor como parâmetro: quando um lead é marcado como contatado, o contador muda,
 * a chave de cache muda junto e os KPIs/fila são relidos do warehouse.
 */
interface RefreshState {
  versao: number;
  atualizar: () => void;
}

const RefreshContext = createContext<RefreshState>({ versao: 0, atualizar: () => {} });

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [versao, setVersao] = useState(() => Date.now() % 1_000_000);
  const atualizar = useCallback(() => setVersao((v) => v + 1), []);
  const value = useMemo(() => ({ versao, atualizar }), [versao, atualizar]);
  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>;
}

export const useRefresh = () => useContext(RefreshContext);
