export const fontOptions = [
  { id: 'sans', label: 'Neutra', family: 'Arial, Helvetica, sans-serif' },
  { id: 'serif', label: 'Cálida', family: 'Georgia, serif' },
  { id: 'hand', label: 'A mano', family: 'Kalam, cursive' },
  { id: 'mono', label: 'Mono', family: '"Courier New", monospace' },
] as const;

export type FontId = (typeof fontOptions)[number]['id'];

export const writingHints = [
  'Escribe directamente en la ficha',
  'Una idea por ficha, a tu manera',
  'Anota lo que no quieres olvidar',
  'Empieza por una palabra clave',
  'Deja espacio para improvisar',
];
