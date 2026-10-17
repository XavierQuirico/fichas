import { ArrowRight, Cloud, Layers, Loader2, Plus } from 'lucide-react';
import { ArchiveIcon, CollectionIcon, HandIcon, NewExposureIcon } from '@/components/icons';
import type { Deck } from '@/lib/fichas';
import { DeckTile } from './deck-tile';
import { ExampleTiles } from './example-tiles';
import type { Sortable } from './types';

type LibraryProps = {
  decks: Deck[];
  visibleDecks: Deck[];
  /** True once the collection has been read from the server. */
  loaded: boolean;
  loading: boolean;
  archived: string[];
  archiveReady: boolean;
  archiveBusy: string | null;
  showArchived: boolean;
  sortable: Sortable;
  cardFont: (id?: string) => string;
  onToggleArchived: () => void;
  onNew: () => void;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string, archive: boolean) => void;
  onRemove: (id: string) => void;
  onCreateExample: (kind: 'example' | 'tutorial') => void;
  onOpenGuide: () => void;
};

export function Library({
  decks,
  visibleDecks,
  loaded,
  loading,
  archived,
  archiveReady,
  archiveBusy,
  showArchived,
  sortable,
  cardFont,
  onToggleArchived,
  onNew,
  onOpen,
  onDuplicate,
  onArchive,
  onRemove,
  onCreateExample,
  onOpenGuide,
}: LibraryProps) {
  return (
    <main className="library">
      <div className="library-heading">
        <div>
          <p className="eyebrow">TU ESPACIO PARA PREPARARTE</p>
          <h1>
            Mis exposiciones
            <span className="count" aria-label={`${decks.length} exposiciones`}>
              <CollectionIcon size={34} />
              <b>{decks.length}</b>
            </span>
          </h1>
          <p className="intro">Una ficha por idea. Todo a tu ritmo.</p>
        </div>
        <button className="button primary new-exposure-button" disabled={!loaded} onClick={onNew}>
          <span className="action-icon">
            <NewExposureIcon size={18} />
          </span>
          Nueva exposición
        </button>
      </div>
      <div className="archive-filter">
        <button disabled={!archiveReady} aria-pressed={showArchived} onClick={onToggleArchived}>
          <ArchiveIcon size={16} />
          {showArchived
            ? 'Volver a las actuales'
            : `Archivadas (${decks.filter((d) => archived.includes(d.id)).length})`}
        </button>
      </div>
      {loading || !archiveReady ? (
        <div className="loading-state">
          <Loader2 className="spin" />
          <p>Cargando tus exposiciones…</p>
        </div>
      ) : (
        <div className="decks-grid">
          {visibleDecks.map((d, i) => (
            <DeckTile
              key={d.id}
              deck={d}
              position={i}
              isArchived={archived.includes(d.id)}
              archiveDisabled={!archiveReady || archiveBusy === d.id}
              sortable={sortable}
              cardFont={cardFont}
              onOpen={() => onOpen(d.id)}
              onDuplicate={() => onDuplicate(d.id)}
              onToggleArchive={() => onArchive(d.id, !archived.includes(d.id))}
              onRemove={() => onRemove(d.id)}
            />
          ))}
          {!showArchived && (
            <button
              className={`new-deck ${!decks.length ? 'first-deck' : ''}`}
              disabled={!loaded}
              onClick={onNew}
            >
              <span className="new-icon">
                <Plus size={30} />
              </span>
              <h2>
                {decks.length ? 'Otra idea por contar' : 'Tu próxima exposición empieza aquí'}
              </h2>
              <p>Crea una colección y añade tus fichas.</p>
              <span className="text-link">
                Crear exposición <ArrowRight size={17} />
              </span>
            </button>
          )}
          {!decks.length && (
            <ExampleTiles
              disabled={!loaded}
              onStartGuide={() => onCreateExample('tutorial')}
              onOpenExample={() => onCreateExample('example')}
            />
          )}
        </div>
      )}
      {decks.length > 0 && (
        <div className="onboarding-links">
          <button onClick={onOpenGuide}>
            <HandIcon size={17} />
            Guía interactiva
          </button>
          <button onClick={() => onCreateExample('example')}>
            <Layers size={17} />
            Abrir ejemplo de exposición
          </button>
        </div>
      )}
      <div className="library-note">
        <span>
          <Cloud size={18} />
          Tus exposiciones se guardan automáticamente.
        </span>
        <span>Prepara. Respira. Comparte.</span>
      </div>
    </main>
  );
}
