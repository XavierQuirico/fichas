import type { CSSProperties } from 'react';
import { ArchiveRestore, ArrowRight } from 'lucide-react';
import { ArchiveIcon, DeleteIcon, DuplicateIcon, MiniStack } from '@/components/icons';
import type { Deck } from '@/lib/fichas';
import type { Sortable } from './types';

type DeckTileProps = {
  deck: Deck;
  position: number;
  isArchived: boolean;
  archiveDisabled: boolean;
  sortable: Sortable;
  cardFont: (id?: string) => string;
  onOpen: () => void;
  onDuplicate: () => void;
  onToggleArchive: () => void;
  onRemove: () => void;
};

export function DeckTile({
  deck: d,
  position,
  isArchived,
  archiveDisabled,
  sortable,
  cardFont,
  onOpen,
  onDuplicate,
  onToggleArchive,
  onRemove,
}: DeckTileProps) {
  return (
    <article
      className={`deck-item ${sortable.className(d.id)}`}
      key={d.id}
      {...sortable.bindings('decks', d.id)}
    >
      <button className="deck-open-hit" aria-label={`Abrir ${d.title}`} onClick={onOpen} />
      <div className="deck-card-layout">
        <div className={`deck-cover cover-${d.cards[0]?.color ?? 'lemon'}`}>
          <div className="deck-cover-topline">
            <span className="cover-caption">
              {(d.id.startsWith('tutorial-') || d.title === 'Habla con confianza') && (
                <span className="tutorial-tag">Guía</span>
              )}
              <span className="cover-index">
                {String(position + 1).padStart(2, '0')} / EXPOSICIÓN
              </span>
            </span>
            <button
              data-no-sort
              className="deck-duplicate icon-button"
              data-tooltip="Duplicar"
              aria-label={`Duplicar ${d.title}`}
              onClick={onDuplicate}
            >
              <DuplicateIcon size={17} />
            </button>
          </div>
          <div className="stack">
            {d.cards[2] && <div className={`stack-under second color-${d.cards[2].color}`} />}{' '}
            {d.cards[1] && <div className={`stack-under first color-${d.cards[1].color}`} />}
            <div
              className={`stack-front paper color-${d.cards[0]?.color ?? 'lemon'} style-${d.cards[0]?.style ?? 'sticky'}`}
              style={{ '--paper-font': cardFont(d.cards[0]?.id) } as CSSProperties}
            >
              <span className="mini-eyebrow">
                <span className="stack-count" aria-label={`${d.cards.length} fichas`}>
                  <MiniStack />
                  <b>{d.cards.length}</b>
                </span>
              </span>
              <strong>{d.cards[0]?.title || d.title}</strong>
              <p>{d.cards[0]?.body.slice(0, 100) || 'Lista para tus ideas.'}</p>
            </div>
          </div>
          <span className="cover-open">
            <ArrowRight size={19} />
          </span>
        </div>
        <div className="deck-info">
          <h2>{d.title}</h2>
          <div className="deck-info-bottom">
            <p className="deck-card-count">
              <MiniStack />
              {d.cards.length} fichas <span>·</span>{' '}
              {new Date(d.updatedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
            </p>
            <div className="deck-actions-row">
              <button
                data-no-sort
                disabled={archiveDisabled}
                className="deck-archive icon-button"
                data-tooltip={isArchived ? 'Restaurar' : 'Archivar'}
                aria-label={`${isArchived ? 'Restaurar' : 'Archivar'} ${d.title}`}
                onClick={onToggleArchive}
              >
                {isArchived ? <ArchiveRestore size={17} /> : <ArchiveIcon size={17} />}
              </button>
              <button
                data-no-sort
                className="deck-delete icon-button"
                data-tooltip="Eliminar"
                aria-label={`Eliminar ${d.title}`}
                onClick={onRemove}
              >
                <DeleteIcon size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
