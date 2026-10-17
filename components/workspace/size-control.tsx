import { TextSizeIcon } from '@/components/icons';
import { Slider } from '@/components/ui/slider';

export function SizeControl({
  size,
  onChange,
}: {
  size: number;
  onChange: (size: number) => void;
}) {
  return (
    <div className="size-control">
      <div className="field-label">
        <span>Tamaño del texto</span>
        <span className="value">{size} px</span>
      </div>
      <div className="slider-line">
        <TextSizeIcon size={17} />
        <Slider
          aria-label="Tamaño del texto de la ficha"
          min={18}
          max={42}
          step={1}
          value={[size]}
          onValueChange={([next]) => onChange(next)}
        />
        <TextSizeIcon size={25} />
      </div>
      <p className="hint">Se aplica solo a esta ficha.</p>
    </div>
  );
}
