'use client';
import { useEffect } from 'react';

type ScreenLock = { release: () => Promise<void> };
type NavigatorWithWakeLock = Navigator & {
  wakeLock?: { request: (type: 'screen') => Promise<ScreenLock> };
};

/** Keeps the screen awake while presenting, where the browser allows it. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let lock: ScreenLock | undefined;
    const acquire = async () => {
      try {
        const wakeLock = (navigator as NavigatorWithWakeLock).wakeLock;
        if (wakeLock && document.visibilityState === 'visible')
          lock = await wakeLock.request('screen');
      } catch {}
    };
    void acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      void lock?.release();
      document.removeEventListener('visibilitychange', acquire);
    };
  }, [active]);
}
