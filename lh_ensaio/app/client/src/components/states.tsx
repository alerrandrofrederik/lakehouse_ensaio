import { Alert, AlertDescription, AlertTitle, Empty, EmptyDescription, EmptyHeader, EmptyTitle, Skeleton } from '@databricks/appkit-ui/react';
import { AlertCircle } from 'lucide-react';

/** Estados obrigatórios de cada bloco de dados: carregando, vazio e erro. */

export function LoadingBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={i === 0 ? 'h-6 w-1/2' : 'h-4 w-full'} />
      ))}
    </div>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Não foi possível carregar os dados</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function EmptyBlock({ title, description }: { title: string; description?: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
    </Empty>
  );
}
