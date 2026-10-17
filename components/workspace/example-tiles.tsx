import { ArrowRight } from 'lucide-react';
import { HandIcon } from '@/components/icons';

type ExampleTilesProps = {
  disabled: boolean;
  onStartGuide: () => void;
  onOpenExample: () => void;
};

/** Two starter tiles shown while the library is empty. */
export function ExampleTiles({ disabled, onStartGuide, onOpenExample }: ExampleTilesProps) {
  return (
    <>
      <article className="example-item guide-example">
        <div className="example-heading">
          <span className="tutorial-tag">Guía</span>
          <span>5 fichas</span>
        </div>
        <div className="example-papers">
          <div className="example-paper-back" />
          <div className="example-paper">
            <span>PRUEBA MIENTRAS APRENDES</span>
            <strong>
              Encuentra
              <br />
              tu ritmo.
            </strong>
            <p>Empieza con un deslizamiento.</p>
          </div>
        </div>
        <h2>Tu primera vuelta por Fichas</h2>
        <p>Desliza, navega y personaliza una ficha de verdad.</p>
        <button className="button primary" disabled={disabled} onClick={onStartGuide}>
          Empezar la guía <HandIcon size={17} />
        </button>
      </article>
      <article className="example-item">
        <div className="example-heading">
          <span className="example-tag">PARA PROBAR</span>
          <span>4 fichas</span>
        </div>
        <div className="example-papers">
          <div className="example-paper-back" />
          <div className="example-paper">
            <span>01 / 04</span>
            <strong>
              Empieza con
              <br />
              una idea.
            </strong>
            <p>Y encuentra tu propio ritmo.</p>
          </div>
        </div>
        <h2>Habla con confianza</h2>
        <p>Explora los estilos y prueba el modo exposición.</p>
        <button className="button secondary" disabled={disabled} onClick={onOpenExample}>
          Abrir ejemplo <ArrowRight size={17} />
        </button>
      </article>
    </>
  );
}
