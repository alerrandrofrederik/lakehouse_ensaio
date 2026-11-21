import { useEffect, useState } from 'react';

export interface WhoAmI {
  email: string | null;
  user: string | null;
}

/** Usuário autenticado, a partir dos cabeçalhos x-forwarded-* que o Databricks Apps injeta. */
export function useWhoAmI(): WhoAmI | null {
  const [me, setMe] = useState<WhoAmI | null>(null);
  useEffect(() => {
    fetch('/api/whoami')
      .then((r) => (r.ok ? (r.json() as Promise<WhoAmI>) : null))
      .then(setMe)
      .catch(() => setMe(null));
  }, []);
  return me;
}
