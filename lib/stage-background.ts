import type { Card } from './fichas';

const coverColors: Record<string, string> = {
  lemon: 'var(--cover-lemon)',
  peach: 'var(--cover-peach)',
  blue: 'var(--cover-blue)',
  mint: 'var(--cover-green)',
  lilac: 'var(--cover-lilac)',
  white: 'var(--cover-white)',
};

const stageOverrides: Record<string, string> = {
  'blue-mist': 'var(--stage-blue-mist)',
  'lilac-mist': 'var(--stage-lilac-mist)',
  ink: 'var(--stage-ink)',
  orange: 'var(--stage-orange)',
  red: 'var(--stage-red)',
};

/** Background behind the card: the card's own colour unless a stage colour was picked. */
export function stageBackground(card: Card | undefined): string {
  const fallback = card?.color ? coverColors[card.color] : 'var(--paper-base)';
  return stageOverrides[card?.backgroundColor ?? 'default'] ?? fallback;
}
