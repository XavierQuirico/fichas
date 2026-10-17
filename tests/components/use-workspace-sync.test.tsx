import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCardFonts } from '@/hooks/use-card-fonts';
import { useWorkspaceSync } from '@/hooks/use-workspace-sync';
import type { Deck } from '@/lib/fichas';

const deck = (title: string): Deck => ({
  id: `deck-${title}`,
  title,
  updatedAt: '2026-01-01T00:00:00.000Z',
  cards: [],
});

type Reply = { status?: number; body: unknown };

/** Replies to fetch calls in order and records every request. */
function mockFetch(replies: Reply[]) {
  const calls: { url: string; method: string; body?: unknown }[] = [];
  const queue = [...replies];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? 'GET',
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });
      const reply = queue.shift() ?? { status: 500, body: { error: 'unexpected request' } };
      const status = reply.status ?? 200;
      return { ok: status < 400, status, json: async () => reply.body } as Response;
    }),
  );
  return calls;
}

describe('useWorkspaceSync', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('loads the collection and reports it saved', async () => {
    mockFetch([{ body: { revision: 4, decks: [deck('Loaded')] } }]);
    const { result } = renderHook(() => useWorkspaceSync());
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('saved'));
    expect(result.current.decks.map((d) => d.title)).toEqual(['Loaded']);
    expect(result.current.loaded.current).toBe(true);
  });

  it('autosaves once after an edit, sending the loaded revision, then reports saved', async () => {
    const calls = mockFetch([{ body: { revision: 4, decks: [] } }, { body: { revision: 5 } }]);
    const { result } = renderHook(() => useWorkspaceSync());
    await waitFor(() => expect(result.current.status).toBe('saved'));

    act(() => result.current.change([deck('New')]));
    expect(result.current.status).toBe('pending');
    expect(calls).toHaveLength(1); // nothing is sent until the user pauses

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    await waitFor(() => expect(result.current.status).toBe('saved'));

    const put = calls.filter((c) => c.method === 'PUT');
    expect(put).toHaveLength(1);
    expect(put[0].body).toMatchObject({ revision: 4, decks: [{ title: 'New' }] });
  });

  it('batches rapid edits into one request with the latest content', async () => {
    const calls = mockFetch([{ body: { revision: 0, decks: [] } }, { body: { revision: 1 } }]);
    const { result } = renderHook(() => useWorkspaceSync());
    await waitFor(() => expect(result.current.status).toBe('saved'));

    act(() => result.current.change([deck('a')]));
    act(() => result.current.change([deck('ab')]));
    act(() => result.current.change([deck('abc')]));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    await waitFor(() => expect(result.current.status).toBe('saved'));

    const put = calls.filter((c) => c.method === 'PUT');
    expect(put).toHaveLength(1);
    expect(put[0].body).toMatchObject({ decks: [{ title: 'abc' }] });
  });

  it('shows the server message when another window saved first (409)', async () => {
    mockFetch([
      { body: { revision: 1, decks: [] } },
      { status: 409, body: { error: 'Esta exposición cambió en otra ventana.' } },
    ]);
    const { result } = renderHook(() => useWorkspaceSync());
    await waitFor(() => expect(result.current.status).toBe('saved'));

    act(() => result.current.change([deck('Mine')]));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Esta exposición cambió en otra ventana.');
    // The edit stays on screen so the user can copy it.
    expect(result.current.decks.map((d) => d.title)).toEqual(['Mine']);
  });

  it('reports a failed load and can retry', async () => {
    const calls = mockFetch([
      { status: 503, body: { error: 'No pudimos cargar tus exposiciones.' } },
      { body: { revision: 2, decks: [deck('Back')] } },
    ]);
    const { result } = renderHook(() => useWorkspaceSync());
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.loaded.current).toBe(false);

    act(() => result.current.reload());
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('saved'));
    expect(result.current.decks).toHaveLength(1);
    expect(calls.filter((c) => c.method === 'GET')).toHaveLength(2);
  });

  it('never saves before the first load has finished', async () => {
    const calls = mockFetch([{ status: 503, body: { error: 'down' } }]);
    const { result } = renderHook(() => useWorkspaceSync());
    await waitFor(() => expect(result.current.status).toBe('error'));
    await act(async () => {
      await result.current.save();
    });
    expect(calls.filter((c) => c.method === 'PUT')).toHaveLength(0);
  });

  it('flush saves pending edits right away instead of waiting for the pause', async () => {
    const calls = mockFetch([{ body: { revision: 0, decks: [] } }, { body: { revision: 1 } }]);
    const { result } = renderHook(() => useWorkspaceSync());
    await waitFor(() => expect(result.current.status).toBe('saved'));

    act(() => result.current.change([deck('Fresh')]));
    expect(calls.filter((c) => c.method === 'PUT')).toHaveLength(0);
    await act(async () => {
      await result.current.flush();
    });

    expect(calls.filter((c) => c.method === 'PUT')).toHaveLength(1);
    expect(result.current.status).toBe('saved');
  });

  it('flush returns without looping when the save fails', async () => {
    const calls = mockFetch([
      { body: { revision: 0, decks: [] } },
      { status: 503, body: { error: 'down' } },
    ]);
    const { result } = renderHook(() => useWorkspaceSync());
    await waitFor(() => expect(result.current.status).toBe('saved'));

    act(() => result.current.change([deck('Fails')]));
    await act(async () => {
      await result.current.flush();
    });

    expect(calls.filter((c) => c.method === 'PUT')).toHaveLength(1);
    expect(result.current.status).toBe('error');
  });
});

describe('useCardFonts', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('saves pending cards before it sends a font for them', async () => {
    const order: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        order.push(`${init?.method ?? 'GET'} ${url}`);
        return { ok: true, status: 200, json: async () => ({ fonts: {} }) } as Response;
      }),
    );
    const beforeSave = vi.fn(async () => {
      order.push('workspace saved');
    });
    const { result } = renderHook(() => useCardFonts({ beforeSave }));
    await waitFor(() => expect(result.current.fontReady).toBe(true));

    act(() => result.current.saveFonts(['card-1'], 'mono'));
    await waitFor(() => expect(result.current.fontMap).toEqual({ 'card-1': 'mono' }));

    expect(order.slice(-2)).toEqual(['workspace saved', 'PUT /api/card-fonts']);
  });
});
