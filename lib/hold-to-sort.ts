/** Gesture arbitration shared by touch and mouse; scrolling wins until a stationary hold. */
export function createHoldToSort(onLift: () => void, delay = 280) {
  let origin: { x: number; y: number } | null = null;
  let phase: 'idle' | 'pending' | 'dragging' | 'scrolling' = 'idle';
  let timer: ReturnType<typeof setTimeout> | null = null;
  const clear = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return {
    start(x: number, y: number) {
      clear();
      origin = { x, y };
      phase = 'pending';
      timer = setTimeout(() => {
        timer = null;
        if (phase === 'pending') {
          phase = 'dragging';
          onLift();
        }
      }, delay);
    },
    move(x: number, y: number) {
      if (phase === 'pending' && origin && Math.hypot(x - origin.x, y - origin.y) > 8) {
        clear();
        phase = 'scrolling';
      }
      return phase;
    },
    phase() {
      return phase;
    },
    cancel() {
      clear();
      origin = null;
      phase = 'idle';
    },
  };
}
