'use client';

import { useEffect, useState } from 'react';

interface Props {
  publicId: string;
  vehicleId: string;
}

/**
 * Client-side behaviours for the vehicle landing page:
 *  - remembers the most recently scanned vehicle (so the installed PWA can
 *    reopen straight to it),
 *  - records a scan (once per browser session per vehicle),
 *  - registers the service worker and offers an "add to home screen" button.
 */
export function LandingClient({ publicId, vehicleId }: Props) {
  const [installEvent, setInstallEvent] = useState<Event | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('lastVehicle', publicId);
      localStorage.setItem('lastVehicleAt', String(Date.now()));
    } catch {
      /* ignore */
    }

    // Record a scan once per session per vehicle.
    try {
      const key = `scanned:${publicId}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        fetch('/api/scan', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ vehicleId }),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* ignore */
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, [publicId, vehicleId]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!showInstall) return null;

  return (
    <button
      onClick={async () => {
        const ev = installEvent as unknown as { prompt: () => Promise<void> };
        if (ev?.prompt) {
          await ev.prompt();
        }
        setShowInstall(false);
      }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full px-5 py-3 text-sm font-semibold shadow-lg"
      style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
    >
      📲 Zum Startbildschirm hinzufügen
    </button>
  );
}
