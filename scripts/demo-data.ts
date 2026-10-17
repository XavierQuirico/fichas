// Sample content for the demo account. Every link uses example.com on purpose.
type Color = 'lemon' | 'peach' | 'blue' | 'mint' | 'lilac' | 'white';
type Style = 'sticky' | 'lined' | 'clean' | 'grid';
type Font = 'sans' | 'serif' | 'hand' | 'mono';

export type DemoCard = {
  id: string;
  title: string;
  body: string;
  color: Color;
  style: Style;
  size: number;
  backgroundColor?: 'default' | 'blue-mist' | 'lilac-mist' | 'ink' | 'orange' | 'red';
  font?: Font;
};

export type DemoDeck = {
  id: string;
  title: string;
  updatedAt: string;
  archived?: boolean;
  cards: DemoCard[];
};

const card = (
  deck: string,
  n: number,
  title: string,
  body: string,
  look: Partial<DemoCard> = {},
): DemoCard => ({
  id: `demo-${deck}-${n}`,
  title,
  body,
  color: 'lemon',
  style: 'sticky',
  size: 26,
  ...look,
});

/** The decks the seed loads. Ids are fixed so that running the seed twice gives the same result. */
export function demoDecks(now = new Date('2026-01-15T10:00:00.000Z')): DemoDeck[] {
  const stamp = (daysAgo: number) =>
    new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'demo-proyecto',
      title: 'Presentación del proyecto final',
      updatedAt: stamp(0),
      cards: [
        card(
          'proyecto',
          1,
          'Empezar con la pregunta',
          'Qué problema resuelve el proyecto.\n\nUna frase, sin tecnicismos.',
          { color: 'lemon', style: 'sticky', font: 'sans' },
        ),
        card(
          'proyecto',
          2,
          'Cómo lo hicimos',
          '• Tres pasos: idea, prototipo, prueba.\n• Un dato concreto por paso.\n• Mostrar el prototipo, no describirlo.',
          { color: 'blue', style: 'lined', font: 'serif' },
        ),
        card(
          'proyecto',
          3,
          'Qué salió mal',
          'Contar un error real y lo que cambiamos después.\n\nPausa aquí y mirar al público.',
          { color: 'peach', style: 'clean', size: 30, font: 'hand' },
        ),
        card(
          'proyecto',
          4,
          'Resultados',
          'Dos números y una conclusión.\n\nMás detalle en https://example.com/proyecto',
          { color: 'mint', style: 'grid', font: 'mono' },
        ),
        card('proyecto', 5, 'Cierre', 'Gracias. Preguntas.', {
          color: 'lilac',
          style: 'sticky',
          size: 34,
          backgroundColor: 'ink',
        }),
      ],
    },
    {
      id: 'demo-pitch',
      title: 'Pitch de producto en tres minutos',
      updatedAt: stamp(2),
      cards: [
        card('pitch', 1, 'Gancho', 'Una situación que todo el mundo reconoce.', {
          color: 'peach',
          style: 'sticky',
          size: 30,
        }),
        card('pitch', 2, 'El problema', 'Cuánto tiempo se pierde hoy y por qué.', {
          color: 'white',
          style: 'lined',
        }),
        card('pitch', 3, 'La solución', 'Una demostración de 30 segundos.', {
          color: 'mint',
          style: 'clean',
          backgroundColor: 'orange',
          font: 'serif',
        }),
        card(
          'pitch',
          4,
          'Siguiente paso',
          'Qué pedimos y para cuándo. Contacto: equipo@example.com',
          {
            color: 'lemon',
            style: 'grid',
          },
        ),
      ],
    },
    {
      id: 'demo-habitos',
      title: 'Charla sobre hábitos de estudio',
      updatedAt: stamp(5),
      cards: [
        card('habitos', 1, 'Por qué importa', 'Estudiar menos horas, pero mejor.', {
          color: 'blue',
          style: 'clean',
          backgroundColor: 'blue-mist',
        }),
        card(
          'habitos',
          2,
          'Tres hábitos',
          '1. Un horario fijo.\n2. Pausas cortas.\n3. Repasar en voz alta.',
          {
            color: 'lilac',
            style: 'lined',
            font: 'hand',
          },
        ),
        card('habitos', 3, 'Para llevarse', 'Elegir un solo hábito y probarlo una semana.', {
          color: 'lemon',
          style: 'sticky',
          size: 32,
        }),
      ],
    },
    {
      id: 'demo-borrador',
      title: 'Borrador antiguo (archivado)',
      updatedAt: stamp(40),
      archived: true,
      cards: [
        card('borrador', 1, 'Ideas sueltas', 'Material que ya no uso, guardado por si acaso.', {
          color: 'white',
          style: 'clean',
        }),
      ],
    },
  ];
}
