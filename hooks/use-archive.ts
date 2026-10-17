'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/** Archived deck ids live on the server; the deck list itself still holds every deck. */
export function useArchive() {
  const [archived, setArchived] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState<string | null>(null);
  const [archiveReady, setArchiveReady] = useState(false);

  useEffect(() => {
    fetch('/api/archive')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<{ ids: string[] }>;
      })
      .then((data) => {
        setArchived(data.ids);
        setArchiveReady(true);
      })
      .catch(() =>
        toast.error(
          'No pudimos cargar las exposiciones archivadas. Recarga para volver a intentarlo.',
        ),
      );
  }, []);

  const archiveDeck = async (id: string, archive: boolean) => {
    setArchiveBusy(id);
    try {
      const r = await fetch('/api/archive', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, archived: archive }),
      });
      if (!r.ok) throw new Error();
      setArchived((ids) => (archive ? [...new Set([...ids, id])] : ids.filter((x) => x !== id)));
      toast.success(archive ? 'Exposición archivada' : 'Exposición restaurada');
    } catch {
      toast.error('No pudimos actualizar el archivo. Inténtalo de nuevo.');
    } finally {
      setArchiveBusy(null);
    }
  };

  return { archived, showArchived, setShowArchived, archiveBusy, archiveReady, archiveDeck };
}
