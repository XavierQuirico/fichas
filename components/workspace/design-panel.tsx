import { AlertCircle, Layers } from 'lucide-react';
import { CheckIcon } from '@/components/icons';
import { fontOptions, type FontId } from '@/lib/card-fonts';
import { backgroundOptions, colors, styles, type Card } from '@/lib/fichas';
import { SizeControl } from './size-control';

type DesignPanelProps = {
  card: Card;
  fontMap: Record<string, FontId>;
  fontReady: boolean;
  fontSaving: boolean;
  /** The text is taller than the card. */
  overflowing: boolean;
  onEdit: (patch: Partial<Card>) => void;
  onFont: (font: FontId) => void;
  onApplyToAll: () => void;
};

export function DesignPanel({
  card,
  fontMap,
  fontReady,
  fontSaving,
  overflowing,
  onEdit,
  onFont,
  onApplyToAll,
}: DesignPanelProps) {
  const background = card.backgroundColor ?? 'default';
  return (
    <>
      <div className="design-panel">
        <p className="design-label">Diseño</p>
        <div className="control-section">
          <div className="field-label">Estilo de la ficha</div>
          <div className="style-options">
            {styles.map((s) => (
              <button
                key={s.id}
                className={`style-option ${card.style === s.id ? 'active' : ''}`}
                aria-pressed={card.style === s.id}
                onClick={() => onEdit({ style: s.id })}
              >
                <span className={`style-sample paper color-lemon style-${s.id}`}>
                  <span>Aa</span>
                </span>
                <span>{s.label}</span>
                {card.style === s.id && <CheckIcon className="style-check" size={14} />}
              </button>
            ))}
          </div>
        </div>
        <div className="control-section">
          <div className="field-label">
            <span>Color</span>
            <span className="color-name">{colors.find((c) => c.id === card.color)?.label}</span>
          </div>
          <div className="swatches">
            {colors.map((c) => (
              <button
                key={c.id}
                aria-label={c.label}
                aria-pressed={card.color === c.id}
                style={{ background: c.hex }}
                className={card.color === c.id ? 'chosen' : ''}
                onClick={() => onEdit({ color: c.id })}
              >
                {card.color === c.id && <CheckIcon size={19} />}
              </button>
            ))}
          </div>
        </div>
        <div className="control-section">
          <div className="field-label">
            <span>Fondo detrás de la ficha</span>
            <span className="color-name">
              {backgroundOptions.find((c) => c.id === background)?.label}
            </span>
          </div>
          <div className="swatches">
            {backgroundOptions.map((c) => (
              <button
                key={c.id}
                aria-label={`Fondo ${c.label.toLowerCase()}`}
                aria-pressed={background === c.id}
                style={{ background: c.hex }}
                className={background === c.id ? 'chosen' : ''}
                onClick={() => onEdit({ backgroundColor: c.id })}
              >
                {background === c.id && <CheckIcon size={19} />}
              </button>
            ))}
          </div>
        </div>
        <div className="control-section">
          <div className="field-label">Tipografía</div>
          <div className="font-options">
            {fontOptions.map((f) => (
              <button
                key={f.id}
                disabled={!fontReady}
                aria-pressed={(fontMap[card.id] ?? 'sans') === f.id}
                style={{ fontFamily: f.family }}
                onClick={() => onFont(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          {fontSaving && (
            <p className="hint" role="status">
              Guardando tipografía…
            </p>
          )}
        </div>
        <div className="control-section">
          <SizeControl size={card.size} onChange={(size) => onEdit({ size })} />
          {overflowing && (
            <p className="overflow-note" role="status">
              <AlertCircle size={18} aria-hidden="true" />
              <span>
                Esta idea necesita un poco más de espacio. Puedes dividirla en otra ficha o reducir
                el tamaño del texto.
              </span>
            </p>
          )}
        </div>
        <button className="apply-all" onClick={onApplyToAll}>
          <Layers size={16} />
          Aplicar diseño a todas
        </button>
      </div>
      <div className="editor-tip">
        <span className="tip-symbol">“</span>
        <p>
          Piensa en recordatorios,
          <br />
          no en un guion completo.
        </p>
      </div>
    </>
  );
}
