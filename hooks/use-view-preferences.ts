'use client';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'fichas-view';

/** Presentation controls the user chose to show, remembered on this device. */
export function useViewPreferences() {
  const [showThumbs, setShowThumbs] = useState(true);
  const [showArrows, setShowArrows] = useState(false);
  const [ready, setReady] = useState(false);

  // localStorage is only readable after mount; reading it during render would
  // make the server and client markup differ and break hydration.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (typeof saved.thumbs === 'boolean') setShowThumbs(saved.thumbs);
      if (typeof saved.arrows === 'boolean') setShowArrows(saved.arrows);
    } catch {}
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ thumbs: showThumbs, arrows: showArrows }));
    } catch {}
  }, [ready, showThumbs, showArrows]);

  return { showThumbs, setShowThumbs, showArrows, setShowArrows };
}
