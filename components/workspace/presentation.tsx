import type { CSSProperties, ReactNode, RefObject } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  PartyPopper,
  RotateCcw,
  Settings2,
} from 'lucide-react';
import { CloseIcon, FilmstripIcon, FullscreenIcon, TextSizeIcon } from '@/components/icons';
import type { useCardDrag } from '@/hooks/use-card-drag';
import type { useEdgeSwipe } from '@/hooks/use-edge-swipe';
import { styles, type Card, type Deck } from '@/lib/fichas';
import { SizeControl } from './size-control';

const tilt = (drag: number) => `rotate(${Math.max(-18, Math.min(18, drag / 28))}deg)`;
const settle = (dragging: boolean) =>
  dragging ? 'none' : 'transform 220ms cubic-bezier(.2,.8,.2,1)';

type PresentationProps = {
  deck: Deck;
  card: Card | undefined;
  index: number;
  /** Showing the closing card after the last real card. */
  finished: boolean;
  stageColor: string;
  paperVars: CSSProperties;
  showThumbs: boolean;
  showArrows: boolean;
  /** Fullscreen or focus mode: the app chrome is hidden. */
  immersive: boolean;
  fullscreenThumbs: boolean;
  navigationOpen: boolean;
  textOpen: boolean;
  overflowing: boolean;
  scrollHint: boolean;
  cardScroll: RefObject<HTMLDivElement | null>;
  textTrigger: RefObject<HTMLButtonElement | null>;
  textPanel: RefObject<HTMLDivElement | null>;
  swipe: ReturnType<typeof useCardDrag>;
  edge: ReturnType<typeof useEdgeSwipe>;
  strip: ReactNode;
  onExit: () => void;
  onOpenNavigation: () => void;
  onToggleText: () => void;
  onCloseText: () => void;
  onFullscreen: () => void;
  onResize: (size: number) => void;
  onNavigate: (index: number) => void;
  onToggleThumbs: () => void;
  onScrolled: () => void;
};

export function Presentation({
  deck,
  card,
  index,
  finished,
  stageColor,
  paperVars,
  showThumbs,
  showArrows,
  immersive,
  fullscreenThumbs,
  navigationOpen,
  textOpen,
  overflowing,
  scrollHint,
  cardScroll,
  textTrigger,
  textPanel,
  swipe,
  edge,
  strip,
  onExit,
  onOpenNavigation,
  onToggleText,
  onCloseText,
  onFullscreen,
  onResize,
  onNavigate,
  onToggleThumbs,
  onScrolled,
}: PresentationProps) {
  const { drag, dragging, leaving, arrival, handlers } = swipe;
  return (
    <main
      className={`presentation ${showThumbs ? 'thumbs-visible' : 'thumbs-hidden'} ${showArrows ? 'arrows-visible' : ''} ${immersive ? 'is-fullscreen' : ''}`}
      style={{ backgroundColor: stageColor }}
      {...edge.handlers}
    >
      <span className="edge-swipe-zone" aria-hidden="true" />
      {edge.edgeProgress > 0 && (
        <span
          className="edge-exit-hint"
          style={{
            opacity: edge.edgeProgress,
            transform: `translateX(${edge.edgeProgress * 20}px)`,
          }}
        >
          <ArrowLeft size={20} />
        </span>
      )}
      <header className="presentation-header">
        <button className="button secondary exit-button" aria-label="Salir" onClick={onExit}>
          <CloseIcon size={21} strokeWidth={2.6} />
          <span>Salir</span>
        </button>
        <div>
          <h1>{deck.title}</h1>
        </div>
        <div className="presentation-tools">
          {!immersive && (
            <>
              <button
                className="icon-button settings-button"
                aria-expanded={navigationOpen}
                aria-label="Opciones de navegación"
                onClick={onOpenNavigation}
              >
                <Settings2 size={20} />
              </button>
              <button
                ref={textTrigger}
                disabled={finished}
                className={`icon-button text-size-button ${textOpen ? 'active' : ''}`}
                aria-expanded={textOpen}
                aria-label="Ajustar tamaño del texto"
                onClick={onToggleText}
              >
                <TextSizeIcon size={22} />
              </button>
            </>
          )}
          {!immersive && (
            <button
              className="icon-button fullscreen-button"
              aria-label="Alternar pantalla completa"
              onClick={onFullscreen}
            >
              <FullscreenIcon size={20} />
            </button>
          )}
        </div>
      </header>
      {textOpen && (
        <div className="present-text-control" ref={textPanel}>
          <SizeControl size={card?.size ?? 24} onChange={onResize} />
          <button className="icon-button" aria-label="Cerrar tamaño de texto" onClick={onCloseText}>
            <CloseIcon size={18} />
          </button>
        </div>
      )}
      <div className="presentation-stage">
        {finished ? (
          <div
            className="present-card finish-card"
            {...handlers}
            style={{
              touchAction: 'pan-y',
              cursor: dragging ? 'grabbing' : 'grab',
              transform: `translateX(${drag}px) ${tilt(drag)}`,
              transition: settle(dragging),
            }}
          >
            <div className="finish-topline">
              <span>CIERRE</span>
              <span>
                {deck.cards.length} {deck.cards.length === 1 ? 'FICHA' : 'FICHAS'}
              </span>
            </div>
            <div className="finish-content">
              <div className="finish-inner">
                <span className="finish-check">
                  <PartyPopper size={34} />
                </span>
                <p className="eyebrow">EXPOSICIÓN COMPLETADA</p>
                <h2>
                  Llegaste
                  <br />
                  al final.
                </h2>
                <p className="finish-message">Puedes volver a tus fichas cuando quieras.</p>
              </div>
            </div>
            <div className="finish-actions">
              <button className="button primary" onClick={() => onNavigate(0)}>
                <RotateCcw size={18} />
                Volver a empezar
              </button>
              <button className="button secondary" onClick={onExit}>
                Volver a editar
              </button>
            </div>
          </div>
        ) : (
          card && (
            <article
              key={card.id}
              className={`present-card paper color-${card.color} style-${card.style} ${dragging ? 'is-dragging' : ''} ${leaving ? 'is-leaving' : ''}`}
              {...handlers}
              style={
                {
                  ...paperVars,
                  '--arrival': `${arrival * 35}px`,
                  transform: `translateX(${drag}px) ${tilt(drag)}`,
                  transition: settle(dragging),
                } as CSSProperties
              }
            >
              <div className="card-topline">
                <span>{styles.find((s) => s.id === card.style)?.label.toUpperCase()}</span>
              </div>
              <div
                ref={cardScroll}
                onScroll={onScrolled}
                className="present-content"
                tabIndex={0}
                aria-label="Contenido de la ficha; desplázate verticalmente si hay más texto"
              >
                {card.title && <h2>{card.title}</h2>}
                <p className="card-body-text">
                  {card.body || (!card.title ? 'Esta ficha está vacía.' : '')}
                </p>
              </div>
              <div className="card-bottomline">
                <span>FICHAS / A TU RITMO</span>
              </div>
              {overflowing && scrollHint && (
                <p className="present-scroll-hint" role="status">
                  <ChevronDown size={16} />
                  Desplázate para seguir leyendo
                </p>
              )}
            </article>
          )
        )}
      </div>
      <div className="presentation-bottom">
        <div className="present-navigation">
          <span className="gesture-tip">Desliza la ficha para cambiar</span>
          <span className="present-counter" aria-live="polite">
            {finished ? 'Fin' : String(index + 1).padStart(2, '0')}{' '}
            <span>/ {String(deck.cards.length).padStart(2, '0')}</span>
          </span>
          {(!immersive || fullscreenThumbs) && (
            <button className="thumbs-toggle" aria-pressed={showThumbs} onClick={onToggleThumbs}>
              <FilmstripIcon size={19} />
              <span>{showThumbs ? 'Ocultar' : 'Ver'} fichas</span>
            </button>
          )}
        </div>
        <div className={`optional-arrows ${showArrows ? 'expanded' : ''}`}>
          <div>
            <button
              className="button nav-arrow nav-previous"
              disabled={index === 0 && !finished}
              onClick={() => onNavigate(index - 1)}
              aria-label="Ficha anterior"
            >
              <ArrowLeft size={19} />
              <span>Anterior</span>
            </button>
            <button
              className="button nav-arrow nav-next"
              disabled={finished}
              onClick={() => onNavigate(index + 1)}
              aria-label="Ficha siguiente"
            >
              <span>Siguiente</span>
              <ArrowRight size={19} />
            </button>
          </div>
        </div>
        <div className={`collapsible-filmstrip ${showThumbs ? 'expanded' : ''}`}>
          <div>{strip}</div>
        </div>
      </div>
    </main>
  );
}
