'use client';
import { useRef, useState, type PointerEvent } from 'react';
import { canStartEdgeSwipe, cancelsEdgeSwipe, completesEdgeSwipe } from '@/lib/edge-swipe';

/** Swipe in from the left edge to leave the presentation. */
export function useEdgeSwipe(onExit: () => void) {
  const [edgeProgress, setEdgeProgress] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);

  const down = (e: PointerEvent<HTMLElement>) => {
    if (!canStartEdgeSwipe(e.pointerType, window.innerWidth, e.clientX)) return;
    start.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const move = (e: PointerEvent<HTMLElement>) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (cancelsEdgeSwipe(dx, dy)) {
      start.current = null;
      setEdgeProgress(0);
      return;
    }
    e.stopPropagation();
    setEdgeProgress(Math.max(0, Math.min(1, dx / 100)));
  };

  const up = (e: PointerEvent<HTMLElement>) => {
    const origin = start.current;
    if (!origin) return;
    start.current = null;
    setEdgeProgress(0);
    e.stopPropagation();
    if (completesEdgeSwipe(e.clientX - origin.x, e.clientY - origin.y)) onExit();
  };

  const cancel = () => {
    start.current = null;
    setEdgeProgress(0);
  };

  return {
    edgeProgress,
    handlers: {
      onPointerDownCapture: down,
      onPointerMoveCapture: move,
      onPointerUpCapture: up,
      onPointerCancelCapture: cancel,
    },
  };
}
