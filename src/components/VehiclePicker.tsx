'use client';

import { useMemo, useState } from 'react';

interface VehicleOption {
  id: string;
  label: string;   // KFZ-Kennzeichen
  sub?: string;    // name / group
}

/**
 * Searchable multi-select for assigning a link directly to individual vehicles.
 * Built for large fleets (200+ vehicles): filter by plate/name, scrollable list.
 */
export function VehiclePicker({
  name,
  vehicles,
  selected,
}: {
  name: string;
  vehicles: VehicleOption[];
  selected: string[];
}) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set(selected));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(
      (v) => v.label.toLowerCase().includes(q) || (v.sub ?? '').toLowerCase().includes(q),
    );
  }, [query, vehicles]);

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      {/* Selected ids submitted with the form (kept in sync, independent of filter). */}
      {[...picked].map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}

      <div className="text-xs font-semibold text-gray-500 uppercase mb-1.5">
        Für einzelne Fahrzeuge {picked.size > 0 ? `(${picked.size} ausgewählt)` : ''}
      </div>

      {vehicles.length === 0 ? (
        <p className="text-xs text-gray-400">Keine Fahrzeuge vorhanden.</p>
      ) : (
        <>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Fahrzeug suchen (Kennzeichen, Name)…"
            className="w-full rounded-lg ring-1 ring-gray-300 px-3 py-2 text-sm mb-2"
          />
          <div className="max-h-48 overflow-y-auto rounded-lg ring-1 ring-gray-200 divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 p-3">Keine Treffer.</p>
            ) : (
              filtered.map((v) => (
                <label key={v.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={picked.has(v.id)}
                    onChange={() => toggle(v.id)}
                    className="h-4 w-4"
                  />
                  <span className="font-medium text-gray-900">{v.label}</span>
                  {v.sub ? <span className="text-gray-400 truncate">· {v.sub}</span> : null}
                </label>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
