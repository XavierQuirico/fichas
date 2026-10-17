'use client';
import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { Card } from '@/lib/fichas';

type Options = {
  present: boolean;
  /** Scrollable text area of the presented card. */
  cardScroll: RefObject<HTMLDivElement | null>;
  card: Card | undefined;
  /** Anything that changes the available space and so needs a re-measure. */
  layoutKey: unknown[];
};

/**
 * Measures the card text: whether it overflows, and where the first baseline
 * sits so the ruled and grid papers line up with the lines of text.
 */
export function usePaperMetrics({ present, cardScroll, card, layoutKey }: Options) {
  const bodyInput = useRef<HTMLTextAreaElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [baseline, setBaseline] = useState(29);

  useLayoutEffect(() => {
    const element = present ? cardScroll.current : bodyInput.current;
    if (!element) {
      setOverflowing(false);
      return;
    }
    const check = () => {
      setOverflowing(element.scrollHeight > element.clientHeight + 2);
      const textElement = present ? element.querySelector('p') : element;
      if (!textElement) return;
      const css = getComputedStyle(textElement);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        context.font = css.font;
        const metrics = context.measureText('Hg');
        const ascent = metrics.fontBoundingBoxAscent || parseFloat(css.fontSize) * 0.9;
        const descent = metrics.fontBoundingBoxDescent || parseFloat(css.fontSize) * 0.2;
        const measured = (parseFloat(css.lineHeight) - ascent - descent) / 2 + ascent + 1;
        setBaseline(measured);
        const paper = element.closest<HTMLElement>('.paper');
        if (paper)
          paper.style.setProperty(
            '--pattern-y',
            `${textElement.getBoundingClientRect().top - paper.getBoundingClientRect().top + measured - (present ? 0 : element.scrollTop)}px`,
          );
      }
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(element);
    element.addEventListener('scroll', check, { passive: true });
    void document.fonts.ready.then(check);
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', check);
    };
    // The measurement depends on the card text and on every layout input passed in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id, card?.body, card?.title, card?.size, present, cardScroll, ...layoutKey]);

  return { bodyInput, overflowing, baseline };
}
