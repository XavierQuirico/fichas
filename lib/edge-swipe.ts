export const canStartEdgeSwipe = (pointerType: string, width: number, x: number) =>
  pointerType === 'touch' && width <= 740 && x >= 0 && x <= 20;
export const cancelsEdgeSwipe = (dx: number, dy: number) =>
  Math.abs(dy) > 35 && Math.abs(dy) > Math.abs(dx);
export const completesEdgeSwipe = (dx: number, dy: number) => dx > 80 && Math.abs(dy) < dx * 0.7;
