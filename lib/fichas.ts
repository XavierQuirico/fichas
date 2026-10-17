export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export type Card = {
  id: string;
  title: string;
  body: string;
  color: 'lemon' | 'peach' | 'blue' | 'mint' | 'lilac' | 'white';
  style: 'sticky' | 'lined' | 'clean' | 'grid';
  size: number;
  backgroundColor?: 'default' | 'blue-mist' | 'lilac-mist' | 'ink' | 'orange' | 'red';
};
export type Deck = { id: string; title: string; cards: Card[]; updatedAt: string };
export const colors = [
  { id: 'lemon', label: 'Amarillo', hex: 'var(--paper-lemon)' },
  { id: 'peach', label: 'Melocotón', hex: 'var(--paper-peach)' },
  { id: 'blue', label: 'Azul', hex: 'var(--paper-blue)' },
  { id: 'mint', label: 'Menta', hex: 'var(--paper-green)' },
  { id: 'lilac', label: 'Lila', hex: 'var(--paper-lilac)' },
  { id: 'white', label: 'Blanco', hex: 'var(--paper-white)' },
] as const;
export const backgroundOptions = [
  { id: 'default', label: 'Papel', hex: 'var(--paper-base)' },
  { id: 'blue-mist', label: 'Bruma azul', hex: 'var(--cover-blue)' },
  { id: 'lilac-mist', label: 'Niebla lila', hex: 'var(--cover-lilac)' },
  { id: 'ink', label: 'Tinta', hex: '#332A22' },
  { id: 'orange', label: 'Naranja', hex: '#D97B3F' },
  { id: 'red', label: 'Rojo', hex: '#B33D3D' },
] as const;
export const styles = [
  { id: 'sticky', label: 'Sticky', description: 'Una nota flotante' },
  { id: 'lined', label: 'Rayas', description: 'Papel de toda la vida' },
  { id: 'clean', label: 'Simple', description: 'Solo tus ideas' },
  { id: 'grid', label: 'Cuadrícula', description: 'Un poco de estructura' },
] as const;
export function newCard(base?: Card): Card {
  return {
    id: newId(),
    title: '',
    body: '',
    color: base?.color ?? 'lemon',
    style: base?.style ?? 'sticky',
    size: base?.size ?? 24,
    backgroundColor: base?.backgroundColor ?? 'default',
  };
}
export function exampleDeck(): Deck {
  return {
    id: newId(),
    title: 'Habla con confianza',
    updatedAt: new Date().toISOString(),
    cards: [
      {
        ...newCard(),
        title: 'Empieza con una idea.',
        body: 'No necesitas memorizarlo todo.\n\nUna buena ficha te recuerda lo importante y te deja hablar a tu manera.',
        color: 'lemon',
      },
      {
        ...newCard(),
        title: 'Menos texto. Más claridad.',
        body: '• Una idea principal por ficha.\n• Palabras que te ayuden a recordar.\n• Un ejemplo que conecte con tu público.',
        color: 'blue',
        style: 'lined',
      },
      {
        ...newCard(),
        title: 'Haz una pausa.',
        body: 'Respira. Mira a tu público.\n\nDesliza hacia la izquierda para avanzar. También puedes saltar a cualquier ficha con las miniaturas.',
        color: 'peach',
        style: 'sticky',
      },
      {
        ...newCard(),
        title: 'Cierra con lo esencial.',
        body: '¿Qué idea quieres que recuerden?\n\nVuelve a ella y termina con calma.',
        color: 'mint',
        style: 'clean',
      },
    ],
  };
}
export function tutorialDeck(): Deck {
  return {
    id: `tutorial-${newId()}`,
    title: 'Tu primera vuelta por Fichas',
    updatedAt: new Date().toISOString(),
    cards: [
      {
        ...newCard(),
        title: 'Prueba a deslizar.',
        body: 'Arrastra esta ficha hacia la izquierda y suéltala.\n\nTu siguiente idea está al otro lado.',
        color: 'lemon',
      },
      {
        ...newCard(),
        title: 'Salta a cualquier idea.',
        body: 'Mira las miniaturas de abajo. Toca la ficha 3 para avanzar directamente.\n\nPuedes volver a esta ficha con su miniatura o deslizando hacia la derecha.',
        color: 'blue',
        style: 'lined',
      },
      {
        ...newCard(),
        title: 'Elige cómo moverte.',
        body: 'Abre los ajustes de arriba. Activa las flechas o esconde las miniaturas y prueba cuál te resulta más cómodo.\n\nEl deslizamiento siempre está disponible.',
        color: 'mint',
        style: 'clean',
      },
      {
        ...newCard(),
        title: 'Haz una ficha tuya.',
        body: 'Pulsa Salir para editar esta misma ficha. Cambia su color, estilo o tamaño de texto en el panel de Diseño.\n\nDespués pulsa Exponer para seguir desde aquí.',
        color: 'peach',
        style: 'grid',
      },
      {
        ...newCard(),
        title: 'Ya encontraste tu ritmo.',
        body: 'Avanza una vez más para llegar al cierre. Desde allí también puedes deslizar hacia la derecha para volver.\n\nCuando lo necesites, tienes una referencia rápida en el botón de ayuda.',
        color: 'lilac',
        style: 'sticky',
      },
    ],
  };
}
