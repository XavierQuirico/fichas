'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Deck } from '@/lib/fichas';

export type SaveStatus = 'loading' | 'saved' | 'pending' | 'saving' | 'error';

type LoadedWorkspace = { revision: number; decks: Deck[] };

async function fetchWorkspace(): Promise<LoadedWorkspace> {
  const response = await fetch('/api/workspace');
  const data = (await response.json()) as LoadedWorkspace & { error?: string };
  if (!response.ok) throw new Error(data.error);
  return data;
}

/**
 * Loads the whole collection and autosaves it. Every save sends the complete
 * collection plus the revision it was based on; the server answers 409 if
 * another window saved first. `generation` counts edits and `savedGeneration`
 * the last edit that reached the server, so a save that finishes while the
 * user keeps typing leaves the status at "pending".
 */
export function useWorkspaceSync() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [status, setStatus] = useState<SaveStatus>('loading');
  const [error, setError] = useState('');
  const revision = useRef(0);
  const current = useRef<Deck[]>([]);
  const generation = useRef(0);
  const savedGeneration = useRef(0);
  const busy = useRef(false);
  const loaded = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingLoad = useRef(false);

  const save = useCallback(async () => {
    if (!loaded.current || busy.current || generation.current === savedGeneration.current) return;
    busy.current = true;
    setStatus('saving');
    const g = generation.current;
    try {
      const response = await fetch('/api/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decks: current.current, revision: revision.current }),
      });
      const data = (await response.json()) as { error?: string; revision: number };
      if (!response.ok) throw new Error(data.error || 'No pudimos guardar. Inténtalo de nuevo.');
      revision.current = data.revision;
      savedGeneration.current = g;
      setError('');
      setStatus(generation.current === g ? 'saved' : 'pending');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'No pudimos guardar.');
    } finally {
      busy.current = false;
    }
  }, []);

  /**
   * Resolves once every edit made so far has reached the server, or once a
   * save fails (the error banner explains why). Other endpoints that point at
   * saved cards, such as card fonts, call this first.
   */
  const flush = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    for (let attempt = 0; attempt < 20; attempt++) {
      if (generation.current === savedGeneration.current) return;
      if (busy.current) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        continue;
      }
      const before = savedGeneration.current;
      await save();
      if (savedGeneration.current === before) return;
    }
  }, [save]);

  const change = useCallback(
    (next: Deck[]) => {
      current.current = next;
      setDecks(next);
      generation.current++;
      setStatus('pending');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void save(), 650);
    },
    [save],
  );

  const startLoad = useCallback(() => {
    if (pendingLoad.current) return;
    pendingLoad.current = true;
    fetchWorkspace()
      .then((data) => {
        current.current = data.decks;
        setDecks(data.decks);
        revision.current = data.revision;
        loaded.current = true;
        setStatus('saved');
        setError('');
      })
      .catch((e: unknown) => {
        setStatus('error');
        setError(e instanceof Error ? e.message : 'No pudimos cargar tus exposiciones.');
      })
      .finally(() => {
        pendingLoad.current = false;
      });
  }, []);

  // The status starts as 'loading', so the first load has nothing to announce.
  useEffect(() => {
    startLoad();
  }, [startLoad]);

  const reload = useCallback(() => {
    if (pendingLoad.current) return;
    setStatus('loading');
    startLoad();
  }, [startLoad]);

  useEffect(() => {
    if (status === 'pending') {
      const t = setTimeout(() => void save(), 750);
      return () => clearTimeout(t);
    }
  }, [status, save, decks]);

  useEffect(() => {
    const onClose = (e: BeforeUnloadEvent) => {
      if (generation.current !== savedGeneration.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onClose);
    const onOnline = () => void save();
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('beforeunload', onClose);
      window.removeEventListener('online', onOnline);
    };
  }, [save]);

  return { decks, status, error, current, loaded, save, flush, change, reload };
}
