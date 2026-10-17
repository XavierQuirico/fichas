'use client';
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { toast } from 'sonner';

type Gesture = { x: number; y: number; time: number; width: number };

type Options = {
  index: number;
  /** Number of cards in the open deck, or null when no deck is open. */
  cardCount: number | null;
  navigate: (index: number) => void;
};

/**
 * Drag-to-change for the presented card. Position `cardCount` is the closing
 * card, so it counts as a valid destination.
 */
export function useCardDrag({ index, cardCount, navigate }: Options) {
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [arrival, setArrival] = useState(1);
  const gesture = useRef<Gesture | null>(null);
  const gestureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetDrag = useCallback(() => {
    gesture.current = null;
    setDragging(false);
    setDrag(0);
    setLeaving(false);
  }, []);

  /** Stops a card that is mid-flight and puts it back. */
  const cancelDrag = useCallback(() => {
    if (gestureTimer.current) clearTimeout(gestureTimer.current);
    resetDrag();
  }, [resetDrag]);

  useEffect(
    () => () => {
      if (gestureTimer.current) clearTimeout(gestureTimer.current);
    },
    [],
  );

  const onDragStart = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || leaving || (e.target as HTMLElement).closest('button')) return;
    gesture.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
      width: e.currentTarget.clientWidth,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onDragMove = (e: PointerEvent<HTMLElement>) => {
    const g = gesture.current;
    if (!g || leaving) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!dragging && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
      gesture.current = null;
      return;
    }
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      setDragging(true);
      const edge = (index === 0 && dx > 0) || (index === (cardCount ?? 0) && dx < 0);
      setDrag(edge ? dx * 0.25 : dx);
    }
  };

  const onDragEnd = (e: PointerEvent<HTMLElement>) => {
    const g = gesture.current;
    gesture.current = null;
    setDragging(false);
    if (!g || cardCount === null || leaving) {
      setDrag(0);
      return;
    }
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    const velocity = Math.abs(dx) / Math.max(1, performance.now() - g.time);
    const passed =
      Math.abs(dx) > Math.max(65, g.width * 0.2) || (Math.abs(dx) > 45 && velocity > 0.55);
    if (passed && Math.abs(dx) > Math.abs(dy) * 1.2) {
      const next = index + (dx < 0 ? 1 : -1);
      if (next < 0 || next > cardCount) {
        setDrag(0);
        toast(next < 0 ? 'Estás en la primera ficha.' : 'Llegaste al final de la exposición.');
        return;
      }
      setLeaving(true);
      setDrag(Math.sign(dx) * (window.innerWidth + 200));
      setArrival(dx < 0 ? 1 : -1);
      gestureTimer.current = setTimeout(() => {
        navigate(next);
        setLeaving(false);
        setDrag(0);
      }, 220);
    } else setDrag(0);
  };

  return {
    drag,
    dragging,
    leaving,
    arrival,
    resetDrag,
    cancelDrag,
    handlers: {
      onPointerDown: onDragStart,
      onPointerMove: onDragMove,
      onPointerUp: onDragEnd,
      onPointerCancel: resetDrag,
    },
  };
}
