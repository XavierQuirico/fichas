'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { fontOptions, type FontId } from '@/lib/card-fonts';

type Options = {
  /**
   * Runs before each font save. The server only stores a font for a card it
   * already has, so the pending collection save must land first.
   */
  beforeSave?: () => Promise<void>;
};

/** Per-card typography. Saves are queued so they reach the server in the order they were made. */
export function useCardFonts({ beforeSave }: Options = {}) {
  const [fontMap, setFontMap] = useState<Record<string, FontId>>({});
  const [fontReady, setFontReady] = useState(false);
  const [fontSaving, setFontSaving] = useState(false);
  const fontQueue = useRef(Promise.resolve());

  useEffect(() => {
    fetch('/api/card-fonts')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<{ fonts: Record<string, FontId> }>;
      })
      .then((data) => {
        setFontMap(data.fonts);
        setFontReady(true);
      })
      .catch(() =>
        toast.error('No pudimos cargar las tipografías. Recarga para volver a intentarlo.'),
      );
  }, []);

  const saveFonts = (ids: string[], font: FontId) => {
    setFontSaving(true);
    fontQueue.current = fontQueue.current.then(async () => {
      try {
        await beforeSave?.();
        const r = await fetch('/api/card-fonts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, font }),
        });
        if (!r.ok) throw new Error();
        setFontMap((m) => ({ ...m, ...Object.fromEntries(ids.map((id) => [id, font])) }));
      } catch {
        toast.error('No se guardó la tipografía. Vuelve a seleccionarla.');
      }
    });
    const task = fontQueue.current;
    void task.finally(() => {
      if (fontQueue.current === task) setFontSaving(false);
    });
  };

  const cardFont = useCallback(
    (id?: string) =>
      fontOptions.find((f) => f.id === (id ? fontMap[id] : undefined))?.family ??
      fontOptions[0].family,
    [fontMap],
  );

  return { fontMap, fontReady, fontSaving, saveFonts, cardFont };
}
