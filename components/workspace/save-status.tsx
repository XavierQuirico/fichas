import { AlertCircle, Loader2 } from 'lucide-react';
import { CheckIcon } from '@/components/icons';
import type { SaveStatus as Status } from '@/hooks/use-workspace-sync';

const labels: Record<Status, string> = {
  loading: 'Cargando…',
  saving: 'Guardando…',
  pending: 'Cambios pendientes',
  error: 'Sin guardar',
  saved: 'Todo guardado',
};

function StatusIcon({ status }: { status: Status }) {
  if (status === 'saved') return <CheckIcon size={15} />;
  if (status === 'error') return <AlertCircle size={15} />;
  return <Loader2 size={15} className="spin" />;
}

export function SaveStatus({ status }: { status: Status }) {
  return (
    <span className={`save-status ${status === 'error' ? 'bad' : ''}`} role="status">
      <StatusIcon status={status} />
      <span>{labels[status]}</span>
    </span>
  );
}
