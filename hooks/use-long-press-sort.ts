'use client';
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type MouseEvent,
  type KeyboardEvent,
  type CSSProperties,
} from 'react';
import { createHoldToSort } from '@/lib/hold-to-sort';
type Sort = {
  group: string;
  id: string;
  over: string;
  side?: 'before' | 'after';
  x: number;
  y: number;
};
type Contact = {
  x: number;
  y: number;
  id: string;
  group: string;
  el: HTMLElement;
  touchId?: number;
  pointerId?: number;
};
export function useLongPressSort(
  onDrop: (group: string, id: string, over: string, side?: 'before' | 'after') => void,
) {
  const [sort, setSort] = useState<Sort | null>(null),
    [pending, setPending] = useState<string | null>(null);
  const drag = useRef<Sort | null>(null),
    start = useRef<Contact | null>(null),
    suppressUntil = useRef(0);
  const dropAction = useRef(onDrop);
  dropAction.current = onDrop;
  const hold = useRef<ReturnType<typeof createHoldToSort> | null>(null);
  if (!hold.current)
    hold.current = createHoldToSort(() => {
      const s = start.current;
      if (!s) return;
      if (s.pointerId !== undefined) s.el.setPointerCapture(s.pointerId);
      drag.current = { group: s.group, id: s.id, over: s.id, x: 0, y: 0 };
      setSort({ ...drag.current });
      setPending(null);
    });
  const cancel = () => {
    hold.current!.cancel();
    start.current = null;
    drag.current = null;
    setSort(null);
    setPending(null);
  };
  const begin = (contact: Contact) => {
    cancel();
    start.current = contact;
    setPending(contact.id);
    hold.current!.start(contact.x, contact.y);
  };
  const move = (x: number, y: number) => {
    const s = start.current;
    if (!s) return;
    const phase = hold.current!.move(x, y);
    if (phase !== 'dragging') {
      if (phase === 'scrolling') setPending(null);
      return;
    }
    const dx = x - s.x,
      dy = y - s.y;
    let over = s.group === 'decks' ? s.id : drag.current!.over,
      side: 'before' | 'after' | undefined;
    const targets = [...document.querySelectorAll<HTMLElement>('[data-sort-id]')].filter(
      (el) => el.dataset.sortGroup === s.group && el.dataset.sortId !== s.id,
    );
    for (const el of targets) {
      const r = el.getBoundingClientRect();
      if (x >= r.left - 8 && x <= r.right + 8 && y >= r.top - 8 && y <= r.bottom + 8) {
        over = el.dataset.sortId!;
        side = x < r.left + r.width / 2 ? 'before' : 'after';
      }
    }
    drag.current = { group: s.group, id: s.id, over, side, x: dx, y: dy };
    setSort({ ...drag.current });
    const rail = s.el.closest('.filmstrip');
    if (rail) {
      const r = rail.getBoundingClientRect();
      if (x > r.right - 35) rail.scrollLeft += 12;
      else if (x < r.left + 35) rail.scrollLeft -= 12;
    } else if (s.group === 'decks') {
      if (y > window.innerHeight - 65) window.scrollBy(0, 12);
      else if (y < 65) window.scrollBy(0, -12);
    }
  };
  const finish = () => {
    const d = drag.current;
    if (d || hold.current!.phase() === 'scrolling') suppressUntil.current = Date.now() + 500;
    if (d && d.id !== d.over) dropAction.current(d.group, d.id, d.over, d.side);
    cancel();
  };
  // Touch uses native scrolling until the stationary hold wins. Do not capture the
  // pointer or prevent touchmove during the pending/scrolling phases: preserve inertia.
  // Once lifted, a non-passive touchmove prevents scrolling for this gesture only.
  // These document-level listeners intentionally mount once; begin/finish only read refs and stable state setters.
  useEffect(() => {
    const down = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        cancel();
        return;
      }
      const target = e.target instanceof Element ? e.target : null;
      if (!target || target.closest('[data-no-sort]')) return;
      const el = target.closest<HTMLElement>('[data-sort-id]');
      if (!el) return;
      const t = e.touches[0];
      begin({
        x: t.clientX,
        y: t.clientY,
        id: el.dataset.sortId!,
        group: el.dataset.sortGroup!,
        el,
        touchId: t.identifier,
      });
    };
    const moving = (e: TouchEvent) => {
      const s = start.current;
      if (s?.touchId === undefined) return;
      if (e.touches.length !== 1) {
        cancel();
        return;
      }
      const t = Array.from(e.touches).find((t) => t.identifier === s.touchId);
      if (!t) return;
      if (hold.current!.phase() === 'dragging') {
        if (!e.cancelable) {
          suppressUntil.current = Date.now() + 500;
          cancel();
          return;
        }
        e.preventDefault();
      }
      move(t.clientX, t.clientY);
    };
    const up = (e: TouchEvent) => {
      const s = start.current;
      if (
        s?.touchId !== undefined &&
        Array.from(e.changedTouches).some((t) => t.identifier === s.touchId)
      )
        finish();
    };
    const cancelled = () => {
      suppressUntil.current = Date.now() + 500;
      cancel();
    };
    const scroll = () => {
      if (hold.current!.phase() === 'pending') {
        hold.current!.cancel();
        setPending(null);
      }
    };
    document.addEventListener('touchstart', down, { passive: true });
    document.addEventListener('touchmove', moving, { passive: false });
    document.addEventListener('touchend', up);
    document.addEventListener('touchcancel', cancelled);
    document.addEventListener('scroll', scroll, true);
    return () => {
      document.removeEventListener('touchstart', down);
      document.removeEventListener('touchmove', moving);
      document.removeEventListener('touchend', up);
      document.removeEventListener('touchcancel', cancelled);
      document.removeEventListener('scroll', scroll, true);
      hold.current!.cancel();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const bindings = (group: string, id: string) => ({
    'data-sort-group': group,
    'data-sort-id': id,
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (
        e.pointerType === 'touch' ||
        e.button !== 0 ||
        !e.isPrimary ||
        (e.target as HTMLElement).closest('[data-no-sort]')
      )
        return;
      begin({ x: e.clientX, y: e.clientY, id, group, el: e.currentTarget, pointerId: e.pointerId });
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'touch') move(e.clientX, e.clientY);
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'touch') return;
      finish();
      if (e.currentTarget.hasPointerCapture(e.pointerId))
        e.currentTarget.releasePointerCapture(e.pointerId);
    },
    onPointerLeave: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'touch' && !drag.current) cancel();
    },
    onPointerCancel: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'touch') cancel();
    },
    onContextMenu: (e: MouseEvent) => {
      if (start.current?.id === id) e.preventDefault();
    },
    onClickCapture: (e: MouseEvent) => {
      if (Date.now() < suppressUntil.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (!e.altKey || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      const nodes = [...document.querySelectorAll<HTMLElement>('[data-sort-id]')].filter(
        (el) => el.dataset.sortGroup === group,
      );
      const at = nodes.findIndex((el) => el.dataset.sortId === id);
      const to = at + (['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 1);
      if (nodes[to]) {
        e.preventDefault();
        dropAction.current(group, id, nodes[to].dataset.sortId!);
      }
    },
    style:
      sort?.id === id
        ? ({
            transform: `translate(${sort.x}px,${sort.y}px) scale(1.035)`,
            zIndex: 20,
            position: 'relative',
            transition: 'none',
          } as CSSProperties)
        : undefined,
  });
  return {
    bindings,
    className: (id: string) =>
      sort?.id === id
        ? 'is-lifted'
        : sort?.over === id
          ? sort.group === 'decks'
            ? `insert-${sort.side}`
            : 'drop-target'
          : pending === id
            ? 'press-pending'
            : '',
    dragging: !!sort,
  };
}
