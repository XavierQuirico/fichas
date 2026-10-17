'use client';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
};
type FullscreenElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

const describe = (e: unknown) => (e instanceof Error ? `${e.name}: ${e.message}` : String(e));

type Options = { closePanels: () => void };

/**
 * Fullscreen for the presentation. Browsers without the Fullscreen API for
 * pages fall back to a "focus mode" that only hides the app's own chrome.
 */
export function useFullscreen({ closePanels }: Options) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenThumbs, setFullscreenThumbs] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  const fullElement = useCallback(() => {
    const doc = document as FullscreenDocument;
    return doc.fullscreenElement || doc.webkitFullscreenElement;
  }, []);

  const leaveFullscreen = useCallback(async () => {
    const doc = document as FullscreenDocument;
    try {
      if (doc.exitFullscreen) await doc.exitFullscreen();
      else await doc.webkitExitFullscreen?.();
    } catch (e) {
      toast.error(`No se pudo salir de pantalla completa: ${describe(e)}`);
    }
  }, []);

  const enterFullscreen = async (showThumbs: boolean) => {
    const el = document.documentElement as FullscreenElement;
    setFullscreenThumbs(showThumbs);
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else {
        setFocusMode(true);
        closePanels();
        toast(
          'Modo enfoque: este navegador no ofrece pantalla completa para páginas. Sus barras pueden seguir visibles.',
          { duration: 8000 },
        );
      }
    } catch (e) {
      toast.error(`Pantalla completa rechazada: ${describe(e)}`);
    }
  };

  useEffect(() => {
    const changed = () => {
      const full = !!fullElement();
      setIsFullscreen(full);
      if (full) closePanels();
    };
    document.addEventListener('fullscreenchange', changed);
    document.addEventListener('webkitfullscreenchange', changed);
    return () => {
      document.removeEventListener('fullscreenchange', changed);
      document.removeEventListener('webkitfullscreenchange', changed);
    };
  }, [fullElement, closePanels]);

  return {
    immersive: isFullscreen || focusMode,
    fullscreenThumbs,
    focusMode,
    setFocusMode,
    fullElement,
    leaveFullscreen,
    enterFullscreen,
  };
}
