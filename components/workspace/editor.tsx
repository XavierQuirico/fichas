import type { CSSProperties, ReactNode, RefObject } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Layers,
  Plus,
} from 'lucide-react';
import { FullscreenIcon, GripIcon, PencilIcon } from '@/components/icons';
import { MAX_CARD_BODY_LENGTH, MAX_CARD_TITLE_LENGTH } from '@/lib/card-limits';
import { writingHints } from '@/lib/card-fonts';
import type { Card, Deck } from '@/lib/fichas';

type EditorProps = {
  deck: Deck;
  card: Card | undefined;
  index: number;
  stageColor: string;
  paperVars: CSSProperties;
  hintIndex: number;
  onNextHint: () => void;
  bodyInput: RefObject<HTMLTextAreaElement | null>;
  /** Filmstrip rendered below the card. */
  strip: ReactNode;
  /** The design panel; shown beside the card on desktop and as a drawer on mobile. */
  designPanel: ReactNode;
  mobileDesignOpen: boolean;
  onToggleMobileDesign: () => void;
  onBack: () => void;
  onRename: () => void;
  onPresent: () => void;
  onEdit: (patch: Partial<Card>) => void;
  onNavigate: (index: number) => void;
  onAddCard: () => void;
};

export function Editor({
  deck,
  card,
  index,
  stageColor,
  paperVars,
  hintIndex,
  onNextHint,
  bodyInput,
  strip,
  designPanel,
  mobileDesignOpen,
  onToggleMobileDesign,
  onBack,
  onRename,
  onPresent,
  onEdit,
  onNavigate,
  onAddCard,
}: EditorProps) {
  return (
    <main className="editor">
      <div className="editor-heading">
        <button
          className="icon-button back-button"
          onClick={onBack}
          aria-label="Volver a mis exposiciones"
        >
          <ArrowLeft size={21} />
        </button>
        <div className="deck-heading">
          <button className="title-edit" onClick={onRename}>
            <h1>{deck.title}</h1>
            <PencilIcon size={15} />
          </button>
          <p>
            {deck.cards.length} fichas <span>·</span> Edita a tu manera
          </p>
        </div>
        <button
          className="button primary present-button"
          disabled={!deck.cards.length}
          onClick={onPresent}
        >
          <span className="action-icon">
            <FullscreenIcon size={18} />
          </span>
          Exponer
        </button>
      </div>
      <div className="editor-layout">
        <section className="workspace" style={{ backgroundColor: stageColor }}>
          <div className="canvas-top">
            <span className="eyebrow">
              {card
                ? `FICHA ${String(index + 1).padStart(2, '0')} DE ${String(deck.cards.length).padStart(2, '0')}`
                : 'TU EXPOSICIÓN'}
            </span>
            <span className="canvas-hint">
              <span key={hintIndex} onAnimationIteration={onNextHint}>
                {writingHints[hintIndex]}
              </span>
            </span>
          </div>
          <div className="card-stage">
            {card ? (
              <div
                key={card.id}
                className={`editable-card paper color-${card.color} style-${card.style}`}
                style={paperVars}
              >
                <div className="card-topline">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <GripIcon size={19} />
                </div>
                <textarea
                  rows={2}
                  aria-label="Título de la ficha (opcional)"
                  className="card-title-input"
                  placeholder="Un título, si quieres…"
                  value={card.title}
                  maxLength={MAX_CARD_TITLE_LENGTH}
                  onChange={(e) => onEdit({ title: e.target.value })}
                />
                <textarea
                  ref={bodyInput}
                  aria-label="Contenido de la ficha"
                  className="card-body-input"
                  placeholder={'¿Qué quieres recordar al hablar?\nEscribe aquí tus ideas clave…'}
                  value={card.body}
                  maxLength={MAX_CARD_BODY_LENGTH}
                  onChange={(e) => onEdit({ body: e.target.value })}
                />
                <div className="card-bottomline">
                  <span>FICHAS / A TU RITMO</span>
                  <span>
                    {index + 1} / {deck.cards.length}
                  </span>
                </div>
              </div>
            ) : (
              <div className="no-cards">
                <Layers size={36} />
                <h2>Vamos con la primera idea</h2>
                <button className="button primary" onClick={onAddCard}>
                  <Plus size={18} />
                  Añadir ficha
                </button>
              </div>
            )}
          </div>
          <div className="canvas-nav">
            <button
              className="icon-button"
              disabled={!card || index === 0}
              onClick={() => onNavigate(index - 1)}
              aria-label="Ficha anterior"
            >
              <ChevronLeft />
            </button>
            <span>{card ? `${index + 1} / ${deck.cards.length}` : 'Sin fichas'}</span>
            <button
              className="icon-button"
              disabled={!card || index === deck.cards.length - 1}
              onClick={() => onNavigate(index + 1)}
              aria-label="Ficha siguiente"
            >
              <ChevronRight />
            </button>
          </div>
          {strip}
        </section>
        <aside className={`customize ${mobileDesignOpen ? 'mobile-expanded' : ''}`}>
          <button
            className="mobile-design-toggle"
            aria-expanded={mobileDesignOpen}
            onClick={onToggleMobileDesign}
          >
            <span>
              Hazla tuya <small>Diseño de la ficha</small>
            </span>
            {mobileDesignOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
          <div className="panel-heading">
            <h2>Hazla tuya</h2>
            <span>Ficha {index + 1}</span>
          </div>
          {designPanel}
        </aside>
      </div>
    </main>
  );
}
