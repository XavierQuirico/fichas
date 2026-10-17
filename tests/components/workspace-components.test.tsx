import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DeckNameDialog } from '@/components/workspace/dialogs';
import { Editor } from '@/components/workspace/editor';
import { Filmstrip } from '@/components/workspace/filmstrip';
import { Library } from '@/components/workspace/library';
import { SaveStatus } from '@/components/workspace/save-status';
import type { Sortable } from '@/components/workspace/types';
import type { Card, Deck } from '@/lib/fichas';

const card = (id: string, title: string): Card => ({
  id,
  title,
  body: `${title} body`,
  color: 'lemon',
  style: 'sticky',
  size: 24,
});

const deck = (id: string, title: string, cards: Card[] = [card(`${id}-1`, 'First')]): Deck => ({
  id,
  title,
  cards,
  updatedAt: '2026-03-04T10:00:00.000Z',
});

const sortable = { className: () => '', bindings: () => ({}) } as unknown as Sortable;
const cardFont = () => 'Arial';

describe('SaveStatus', () => {
  it.each([
    ['saved', 'Todo guardado'],
    ['pending', 'Cambios pendientes'],
    ['saving', 'Guardando…'],
    ['loading', 'Cargando…'],
    ['error', 'Sin guardar'],
  ] as const)('shows "%s" as "%s"', (status, label) => {
    render(<SaveStatus status={status} />);
    expect(screen.getByRole('status')).toHaveTextContent(label);
  });
});

describe('Library', () => {
  const base = {
    decks: [] as Deck[],
    visibleDecks: [] as Deck[],
    loaded: true,
    loading: false,
    archived: [] as string[],
    archiveReady: true,
    archiveBusy: null,
    showArchived: false,
    sortable,
    cardFont,
    onToggleArchived: vi.fn(),
    onNew: vi.fn(),
    onOpen: vi.fn(),
    onDuplicate: vi.fn(),
    onArchive: vi.fn(),
    onRemove: vi.fn(),
    onCreateExample: vi.fn(),
    onOpenGuide: vi.fn(),
  };

  it('offers the guide and the example when there are no decks', async () => {
    const onCreateExample = vi.fn();
    render(<Library {...base} onCreateExample={onCreateExample} />);
    await userEvent.click(screen.getByRole('button', { name: /Empezar la guía/ }));
    await userEvent.click(screen.getByRole('button', { name: /Abrir ejemplo/ }));
    expect(onCreateExample).toHaveBeenNthCalledWith(1, 'tutorial');
    expect(onCreateExample).toHaveBeenNthCalledWith(2, 'example');
  });

  it('lists decks, opens one, and counts archived ones', async () => {
    const onOpen = vi.fn();
    const onArchive = vi.fn();
    const decks = [deck('a', 'Alpha'), deck('b', 'Beta')];
    render(
      <Library
        {...base}
        decks={decks}
        visibleDecks={[decks[0]]}
        archived={['b']}
        onOpen={onOpen}
        onArchive={onArchive}
      />,
    );
    expect(screen.getByText('Archivadas (1)')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Beta' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Abrir Alpha' }));
    expect(onOpen).toHaveBeenCalledWith('a');
    await userEvent.click(screen.getByRole('button', { name: 'Archivar Alpha' }));
    expect(onArchive).toHaveBeenCalledWith('a', true);
  });

  it('disables creation until the collection has loaded', () => {
    render(<Library {...base} loaded={false} />);
    expect(screen.getByRole('button', { name: /Nueva exposición/ })).toBeDisabled();
  });

  it('shows a loading state instead of the grid while loading', () => {
    render(<Library {...base} loading />);
    expect(screen.getByText('Cargando tus exposiciones…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Empezar la guía/ })).not.toBeInTheDocument();
  });
});

describe('Filmstrip', () => {
  const cards = [card('c1', 'One'), card('c2', 'Two')];
  const props = {
    deck: deck('d', 'Deck', cards),
    index: 0,
    stripRef: createRef<HTMLDivElement>(),
    sortable,
    cardFont,
    onNavigate: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
    onAdd: vi.fn(),
  };

  it('marks the current card and navigates to another one', async () => {
    const onNavigate = vi.fn();
    render(<Filmstrip {...props} present={false} onNavigate={onNavigate} />);
    expect(screen.getByRole('button', { name: /Ir a ficha 1: One/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: /Ir a ficha 2: Two/ }));
    expect(onNavigate).toHaveBeenCalledWith(1);
  });

  it('only offers "add card" while editing', async () => {
    const onAdd = vi.fn();
    const { rerender } = render(<Filmstrip {...props} present={false} onAdd={onAdd} />);
    await userEvent.click(screen.getByRole('button', { name: 'Añadir ficha' }));
    expect(onAdd).toHaveBeenCalledOnce();
    rerender(<Filmstrip {...props} present onAdd={onAdd} />);
    expect(screen.queryByRole('button', { name: 'Añadir ficha' })).not.toBeInTheDocument();
  });
});

describe('DeckNameDialog', () => {
  it('cannot be submitted with a blank name', () => {
    render(
      <DeckNameDialog
        open
        onOpenChange={vi.fn()}
        rename={false}
        title="   "
        onTitleChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Crear exposición/ })).toBeDisabled();
  });

  it('submits a real name and limits it to 160 characters', async () => {
    const onSubmit = vi.fn();
    render(
      <DeckNameDialog
        open
        onOpenChange={vi.fn()}
        rename
        title="Mi charla"
        onTitleChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '160');
    await userEvent.click(screen.getByRole('button', { name: /Guardar nombre/ }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});

describe('Editor', () => {
  it('limits the card text to what the server accepts', () => {
    const c = card('c1', 'Hello');
    render(
      <Editor
        deck={deck('d', 'Deck', [c])}
        card={c}
        index={0}
        stageColor="white"
        paperVars={{}}
        hintIndex={0}
        onNextHint={vi.fn()}
        bodyInput={createRef<HTMLTextAreaElement>()}
        strip={null}
        designPanel={null}
        mobileDesignOpen={false}
        onToggleMobileDesign={vi.fn()}
        onBack={vi.fn()}
        onRename={vi.fn()}
        onPresent={vi.fn()}
        onEdit={vi.fn()}
        onNavigate={vi.fn()}
        onAddCard={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Título de la ficha (opcional)')).toHaveAttribute(
      'maxlength',
      '300',
    );
    expect(screen.getByLabelText('Contenido de la ficha')).toHaveAttribute('maxlength', '20000');
    const nav = screen.getByRole('button', { name: 'Ficha anterior' });
    expect(nav).toBeDisabled();
    expect(within(document.body).getByRole('button', { name: 'Ficha siguiente' })).toBeDisabled();
  });
});
