'use client';

import { useEffect, useState } from 'react';

// Stable PWA entry point. Redirects to the most recently scanned vehicle so the
// installed app always shows the current vehicle without re-installing.
export default function AppEntry() {
  const [noVehicle, setNoVehicle] = useState(false);

  useEffect(() => {
    let last: string | null = null;
    try {
      last = localStorage.getItem('lastVehicle');
    } catch {
      /* ignore */
    }
    if (last) {
      window.location.replace(`/v/${last}`);
    } else {
      setNoVehicle(true);
    }
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center bg-gray-50">
      {noVehicle ? (
        <>
          <h1 className="text-xl font-semibold text-gray-900">Noch kein Fahrzeug gescannt</h1>
          <p className="max-w-sm text-gray-600">
            Bitte scannen Sie den QR-Code an Ihrem Fahrzeug. Die App öffnet danach automatisch die
            zuletzt gescannte Fahrzeug-Seite.
          </p>
        </>
      ) : (
        <p className="text-gray-500">Einen Moment…</p>
      )}
    </main>
  );
}
