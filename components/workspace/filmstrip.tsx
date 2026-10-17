import type { CSSProperties, RefObject } from 'react';
import { Copy, Plus } from 'lucide-react';
import { DeleteIcon, DotsIcon } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Deck } from '@/lib/fichas';
import type { Sortable } from './types';

type FilmstripProps = {
  deck: Deck;
  index: number;
  /** The "add card" button only appears while editing. */
  present: boolean;
  stripRef: RefObject<HTMLDivElement | null>;
  sortable: Sortable;
  cardFont: (id?: string) => string;
  onNavigate: (index: number) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
};

export function Filmstrip({
  deck,
  index,
  present,
  stripRef,
  sortable,
  cardFont,
  onNavigate,
  onDuplicate,
  onDelete,
  onAdd,
}: FilmstripProps) {
  return (
    <div className="filmstrip" ref={stripRef}>
      {deck.cards.map((c, i) => (
        <div
          key={c.id}
          className={`thumb-item ${i === index ? 'selected' : ''} ${sortable.className(c.id)}`}
          {...sortable.bindings('cards', c.id)}
        >
          <button
            aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
            aria-label={`Ir a ficha ${i + 1}: ${c.title || 'Sin título'}`}
            aria-current={i === index ? 'true' : undefined}
            className={`thumb-wrap ${i === index ? 'selected' : ''}`}
            onClick={() => onNavigate(i)}
          >
            <span
              className={`thumb paper color-${c.color} style-${c.style}`}
              style={{ '--paper-font': cardFont(c.id) } as CSSProperties}
            >
              <strong>{c.title || c.body.slice(0, 32) || 'Nueva ficha'}</strong>
              <span>{c.body.slice(0, 85)}</span>
            </span>
            <span className="thumb-label">{String(i + 1).padStart(2, '0')}</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button data-no-sort className="thumb-menu" aria-label={`Opciones de ficha ${i + 1}`}>
                <DotsIcon size={17} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="card-menu">
              <DropdownMenuItem
                onSelect={() => onDuplicate(c.id)}
                disabled={deck.cards.length >= 200}
              >
                <Copy size={16} />
                Duplicar ficha
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onDelete(c.id)} variant="destructive">
                <DeleteIcon size={16} />
                Eliminar ficha
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
      {!present && (
        <button className="add-thumb" onClick={onAdd} aria-label="Añadir ficha">
          <Plus size={23} />
          <span>Añadir</span>
        </button>
      )}
    </div>
  );
}
